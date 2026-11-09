import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { OrderService } from '../src/services/order.service';
import { AuthService } from '../src/services/auth.service';
import { OutletService } from '../src/services/outlet.service';

describe('Order State Machine & Access Control', () => {
  test('Enforces strictly ordered transitions: PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED', async () => {
    const customer = await AuthService.register({
      email: `state-machine-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Order Machine User',
    });

    const outlets = await OutletService.listOutlets();
    const outlet = outlets[0];

    const order = await OrderService.createOrder(customer.user.id, {
      outletId: outlet.id,
      fulfillmentType: 'PICKUP',
      paymentMethod: 'UPI',
      items: [
        {
          itemId: 'item-veg-biryani',
          itemName: 'Veg biryani',
          quantity: 1,
        },
      ],
    });

    assert.strictEqual(order.status, 'PLACED');

    const staffActor = {
      id: 'staff-user-1',
      role: 'KITCHEN_STAFF' as const,
      assignedOutletId: outlet.id,
    };

    // 1. PLACED -> ACCEPTED
    const accepted = await OrderService.updateOrderStatus(order.id, 'ACCEPTED', undefined, staffActor);
    assert.strictEqual(accepted.status, 'ACCEPTED');

    // 2. ACCEPTED -> PREPARING
    const preparing = await OrderService.updateOrderStatus(order.id, 'PREPARING', undefined, staffActor);
    assert.strictEqual(preparing.status, 'PREPARING');

    // 3. PREPARING -> READY
    const ready = await OrderService.updateOrderStatus(order.id, 'READY', undefined, staffActor);
    assert.strictEqual(ready.status, 'READY');

    // 4. READY -> COMPLETED
    const completed = await OrderService.updateOrderStatus(order.id, 'COMPLETED', undefined, staffActor);
    assert.strictEqual(completed.status, 'COMPLETED');
  });

  test('Rejects invalid transitions and skips: e.g. PLACED -> COMPLETED', async () => {
    const customer = await AuthService.register({
      email: `invalid-transition-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Invalid Transition User',
    });

    const outlets = await OutletService.listOutlets();
    const outlet = outlets[0];

    const order = await OrderService.createOrder(customer.user.id, {
      outletId: outlet.id,
      fulfillmentType: 'PICKUP',
      paymentMethod: 'UPI',
      items: [
        {
          itemId: 'item-double-meetha',
          itemName: 'Double ka meetha',
          quantity: 1,
        },
      ],
    });

    const staffActor = {
      id: 'staff-user-2',
      role: 'KITCHEN_STAFF' as const,
      assignedOutletId: outlet.id,
    };

    // Attempt direct transition from PLACED to COMPLETED (skipping ACCEPTED, PREPARING, READY)
    await assert.rejects(
      async () => {
        await OrderService.updateOrderStatus(order.id, 'COMPLETED', undefined, staffActor);
      },
      (err: any) => err.code === 'INVALID_STATUS_TRANSITION',
      'Should reject direct jump from PLACED to COMPLETED'
    );
  });

  test('Cross-outlet isolation: Staff cannot access or update orders for a different outlet', async () => {
    const outlets = await OutletService.listOutlets();
    assert.ok(outlets.length >= 2, 'Need at least 2 outlets for isolation test');
    const outletA = outlets[0];
    const outletB = outlets[1];

    const customer = await AuthService.register({
      email: `isolation-cust-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Isolation Cust',
    });

    // Order created at outlet A
    const orderAtOutletA = await OrderService.createOrder(customer.user.id, {
      outletId: outletA.id,
      fulfillmentType: 'PICKUP',
      paymentMethod: 'UPI',
      items: [
        {
          itemId: 'item-veg-biryani',
          itemName: 'Veg biryani',
          quantity: 1,
        },
      ],
    });

    // Staff assigned exclusively to outlet B
    const staffFromOutletB = {
      id: 'staff-b',
      role: 'KITCHEN_STAFF' as const,
      assignedOutletId: outletB.id,
    };

    // Staff from outlet B attempts to view or update order from outlet A
    await assert.rejects(
      async () => {
        await OrderService.getOrderById(orderAtOutletA.id, staffFromOutletB);
      },
      (err: any) => err.code === 'CROSS_OUTLET_FORBIDDEN',
      'Staff from Outlet B must be denied reading orders from Outlet A'
    );

    await assert.rejects(
      async () => {
        await OrderService.updateOrderStatus(orderAtOutletA.id, 'ACCEPTED', undefined, staffFromOutletB);
      },
      (err: any) => err.code === 'CROSS_OUTLET_FORBIDDEN',
      'Staff from Outlet B must be denied updating orders from Outlet A'
    );
  });
});

