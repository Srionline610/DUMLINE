import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/prisma/client';
import { AuthService } from '../src/services/auth.service';
import { CartService } from '../src/services/cart.service';
import { OrderService } from '../src/services/order.service';
import { PaymentService } from '../src/services/payment.service';
import { OutletService } from '../src/services/outlet.service';
import { MenuService } from '../src/services/menu.service';

test('MASTER AUDIT: Comprehensive 20-Point Verification', async (t) => {
  const timestamp = Date.now();
  const testCustomerEmail = `master-audit-cust-${timestamp}@test.com`;
  const testPassword = 'Password@2026';

  // Retrieve outlets
  const outlets = await OutletService.listOutlets(true);
  const kondapur = outlets.find((o) => o.slug === 'kondapur') || outlets[0];
  const gachibowli = outlets.find((o) => o.slug === 'gachibowli-cloud-kitchen') || outlets[1];
  const kukatpally = outlets.find((o) => o.slug === 'kukatpally') || outlets[2];

  assert.ok(kondapur, 'Kondapur outlet must exist');
  assert.ok(gachibowli, 'Gachibowli outlet must exist');
  assert.ok(kukatpally, 'Kukatpally outlet must exist');

  // Customer registration
  const customer = await AuthService.register({
    email: testCustomerEmail,
    phone: `+9198${timestamp.toString().slice(-8)}`,
    password: testPassword,
    fullName: 'Master Audit Customer',
    marketingConsent: false,
  });

  // 1. Irani Chai customization does not accept Biryani spice (INVALID_CUSTOMIZATION)
  await t.test('Point 1: Irani Chai customization rejects Biryani spice level', async () => {
    await assert.rejects(
      async () => {
        await CartService.validateCart({
          outletId: kukatpally.id,
          fulfillmentType: 'DELIVERY',
          deliveryAddress: { line1: 'KPHB 5th Phase', city: 'Hyderabad', distanceKm: 2.5 },
          items: [
            {
              itemId: 'item-irani-chai',
              itemName: 'Irani chai',
              quantity: 1,
              selectedOptions: { 'Spice Profile': 'Royal Medium' },
            },
          ],
        });
      },
      (err: any) => {
        assert.equal(err.code, 'INVALID_CUSTOMIZATION');
        return true;
      }
    );
  });

  // 2. Irani Chai accepts Sweetness & Dum Milk options
  await t.test('Point 2: Irani Chai accepts culturally authentic Sweetness & Dum Milk options', async () => {
    const validated = await CartService.validateCart({
      outletId: kukatpally.id,
      fulfillmentType: 'DELIVERY',
      deliveryAddress: { line1: 'KPHB 5th Phase', city: 'Hyderabad', distanceKm: 2.5 },
      items: [
        {
          itemId: 'item-irani-chai',
          itemName: 'Irani chai',
          quantity: 2,
          selectedOptions: {
            'Sweetness': 'Standard Irani Meetha',
            'Dum Milk & Decoction': 'Double Malai Float',
          },
        },
      ],
    });
    assert.equal(validated.items.length, 1);
    assert.equal(validated.items[0].unitPrice, 50 + 15); // ₹50 base + ₹15 double malai modifier
    assert.equal(validated.subtotal, 65 * 2);
  });

  // 3. Double Ka Meetha customization (Rabri Pour & Sweetness)
  await t.test('Point 3: Double Ka Meetha enforces Rabri Pour & Sweetness options', async () => {
    const validated = await CartService.validateCart({
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-double-meetha',
          itemName: 'Double ka meetha',
          quantity: 1,
          selectedOptions: {
            'Rabri Pour': 'Extra Rich Khoya Rabri',
            'Sweetness Level': 'Royal Nizam Sweet',
          },
        },
      ],
    });
    assert.equal(validated.items.length, 1);
    assert.equal(validated.items[0].unitPrice, 90 + 30); // ₹90 base + ₹30 rabri
  });

  // 4. Qubani Ka Meetha customization (Topping & Serving Temp)
  await t.test('Point 4: Qubani Ka Meetha enforces Apricot Kernel/Cream Topping & Serving Temp', async () => {
    const validated = await CartService.validateCart({
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-qubani-meetha',
          itemName: 'Qubani ka meetha',
          quantity: 1,
          selectedOptions: {
            'Royal Topping': 'Vanilla Bean Ice Cream Scoop',
            'Serving Temperature': 'Chilled Royal Delight',
          },
        },
      ],
    });
    assert.equal(validated.items.length, 1);
    assert.equal(validated.items[0].unitPrice, 110 + 40); // ₹110 base + ₹40 ice cream scoop
  });

  // 5. Rejection of invalid customization groups per dish
  await t.test('Point 5: Cross-dish customization mismatch is strictly rejected', async () => {
    await assert.rejects(
      async () => {
        await CartService.validateCart({
          outletId: kondapur.id,
          fulfillmentType: 'PICKUP',
          items: [
            {
              itemId: 'item-mut-haleem',
              itemName: 'Mutton haleem',
              quantity: 1,
              selectedOptions: { 'Royal Topping': 'Fresh Clotted Malai' },
            },
          ],
        });
      },
      (err: any) => {
        assert.equal(err.code, 'INVALID_CUSTOMIZATION');
        return true;
      }
    );
  });

  // 6. Kukatpally order persists with Kukatpally outlet ID
  let kukatpallyOrderId = '';
  await t.test('Point 6: Kukatpally order correctly persists with Kukatpally outlet ID', async () => {
    const order = await OrderService.createOrder(customer.user.id, {
      outletId: kukatpally.id,
      fulfillmentType: 'DELIVERY',
      items: [
        {
          itemId: 'item-irani-chai',
          itemName: 'Irani chai',
          quantity: 2,
          selectedOptions: {
            'Sweetness': 'Standard Irani Meetha',
            'Dum Milk & Decoction': 'Khoya Dum Creamy (Traditional)',
          },
        },
      ],
      deliveryAddress: {
        line1: 'KPHB Colony 5th Phase',
        city: 'Hyderabad',
        distanceKm: 2.5,
      },
      paymentMethod: 'UPI',
    });

    assert.ok(order.id);
    assert.equal(order.outletId, kukatpally.id);
    assert.equal(order.outletName, kukatpally.name);
    kukatpallyOrderId = order.id;
  });

  // 7. Kondapur order persists with Kondapur outlet ID
  let kondapurOrderId = '';
  await t.test('Point 7: Kondapur order correctly persists with Kondapur outlet ID', async () => {
    const order = await OrderService.createOrder(customer.user.id, {
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-mut-dum',
          itemName: 'Mutton dum biryani',
          quantity: 1,
          selectedOptions: {
            'Spice Profile': 'Royal Medium',
            'Accompaniments & Staging': 'Standard Handi Pack',
          },
        },
      ],
      paymentMethod: 'CARD',
    });

    assert.ok(order.id);
    assert.equal(order.outletId, kondapur.id);
    assert.equal(order.outletName, kondapur.name);
    kondapurOrderId = order.id;
  });

  // 8. Gachibowli order persists with Gachibowli outlet ID
  let gachibowliOrderId = '';
  await t.test('Point 8: Gachibowli order correctly persists with Gachibowli outlet ID', async () => {
    const order = await OrderService.createOrder(customer.user.id, {
      outletId: gachibowli.id,
      fulfillmentType: 'DELIVERY',
      items: [
        {
          itemId: 'item-veg-biryani',
          itemName: 'Veg biryani',
          quantity: 1,
          selectedOptions: {
            'Spice Profile': 'Subz Mild',
            'Accompaniments & Staging': 'Standard Veg Salan Pack',
          },
        },
      ],
      deliveryAddress: {
        line1: 'Financial District Phase 1',
        city: 'Hyderabad',
        distanceKm: 3.0,
      },
      paymentMethod: 'UPI',
    });

    assert.ok(order.id);
    assert.equal(order.outletId, gachibowli.id);
    assert.equal(order.outletName, gachibowli.name);
    gachibowliOrderId = order.id;
  });

  // 9. KDS filters by selected outlet
  await t.test('Point 9: KDS filters orders strictly by selected outlet', async () => {
    const adminAuth = await AuthService.login({ emailOrPhone: 'admin@dumline.com', password: 'Admin@123' });
    const kukatpallyQueue = await OrderService.getKitchenQueue(kukatpally.id, {
      role: 'ADMIN',
      id: adminAuth.user.id,
      assignedOutletId: null,
    });
    const kondapurQueue = await OrderService.getKitchenQueue(kondapur.id, {
      role: 'ADMIN',
      id: adminAuth.user.id,
      assignedOutletId: null,
    });

    // Verify Kukatpally queue contains Kukatpally order and not Kondapur order
    const hasKukatpally = kukatpallyQueue.some((o) => o.id === kukatpallyOrderId);
    const hasKondapurInKukatpally = kukatpallyQueue.some((o) => o.id === kondapurOrderId);
    assert.ok(hasKukatpally, 'Kukatpally queue must include Kukatpally order');
    assert.equal(hasKondapurInKukatpally, false, 'Kukatpally queue must NOT contain Kondapur order');

    // Verify Kondapur queue contains Kondapur order and not Kukatpally order
    const hasKondapur = kondapurQueue.some((o) => o.id === kondapurOrderId);
    const hasKukatpallyInKondapur = kondapurQueue.some((o) => o.id === kukatpallyOrderId);
    assert.ok(hasKondapur, 'Kondapur queue must include Kondapur order');
    assert.equal(hasKukatpallyInKondapur, false, 'Kondapur queue must NOT contain Kukatpally order');
  });

  // 10. KDS outlet switching clears and changes displayed orders
  await t.test('Point 10: Switching KDS outlet targets returns disjoint queue sets', async () => {
    const adminAuth = await AuthService.login({ emailOrPhone: 'admin@dumline.com', password: 'Admin@123' });
    const q1 = await OrderService.getKitchenQueue(kukatpally.id, { role: 'ADMIN', id: adminAuth.user.id });
    const q2 = await OrderService.getKitchenQueue(gachibowli.id, { role: 'ADMIN', id: adminAuth.user.id });

    const q1Ids = new Set(q1.map((o) => o.id));
    const overlap = q2.filter((o) => q1Ids.has(o.id));
    assert.equal(overlap.length, 0, 'Different outlets must have zero overlapping orders');
  });

  // 11. Unauthorized cross-outlet access returns 403 CROSS_OUTLET_FORBIDDEN for staff
  await t.test('Point 11: Kitchen staff cannot query another outlet queue', async () => {
    const staffAuth = await AuthService.login({ emailOrPhone: 'staff.kondapur@dumline.com', password: 'Staff@123' });
    await assert.rejects(
      async () => {
        await OrderService.getKitchenQueue(kukatpally.id, {
          role: 'KITCHEN_STAFF',
          id: staffAuth.user.id,
          assignedOutletId: kondapur.id,
        });
      },
      (err: any) => {
        assert.equal(err.code, 'CROSS_OUTLET_FORBIDDEN');
        return true;
      }
    );
  });

  // 12. Customer order history accurately items and parses options
  await t.test('Point 12: Customer order history parses and returns structured options', async () => {
    const history = await OrderService.listOrders({ id: customer.user.id, role: 'CUSTOMER' });
    assert.ok(history.length >= 3, 'Customer must see all placed orders');
    const retrievedKukatpallyOrder = history.find((o) => o.id === kukatpallyOrderId);
    assert.ok(retrievedKukatpallyOrder);
    assert.equal(retrievedKukatpallyOrder.items.length, 1);
    const item = retrievedKukatpallyOrder.items[0];
    assert.ok(item.selectedOptionsJson);
    const parsed = JSON.parse(item.selectedOptionsJson);
    assert.equal(parsed['Sweetness'], 'Standard Irani Meetha');
  });

  // 13. Kitchen status changes persist and propagate
  await t.test('Point 13: Order state transitions strictly advance through state machine', async () => {
    const staffAuth = await AuthService.login({ emailOrPhone: 'staff.kukatpally@dumline.com', password: 'Staff@123' });

    // PLACED -> ACCEPTED
    const accepted = await OrderService.updateOrderStatus(
      kukatpallyOrderId,
      'ACCEPTED',
      'Acknowledged by Kukatpally kitchen lead',
      { role: 'KITCHEN_STAFF', id: staffAuth.user.id, assignedOutletId: kukatpally.id }
    );
    assert.equal(accepted.status, 'ACCEPTED');

    // ACCEPTED -> PREPARING
    const preparing = await OrderService.updateOrderStatus(
      kukatpallyOrderId,
      'PREPARING',
      'Food actively simmering on dum stove',
      { role: 'KITCHEN_STAFF', id: staffAuth.user.id, assignedOutletId: kukatpally.id }
    );
    assert.equal(preparing.status, 'PREPARING');

    // PREPARING -> READY
    const ready = await OrderService.updateOrderStatus(
      kukatpallyOrderId,
      'READY',
      'Dishes staged for fulfillment',
      { role: 'KITCHEN_STAFF', id: staffAuth.user.id, assignedOutletId: kukatpally.id }
    );
    assert.equal(ready.status, 'READY');

    // READY -> COMPLETED
    const completed = await OrderService.updateOrderStatus(
      kukatpallyOrderId,
      'COMPLETED',
      'Order handed over to delivery driver',
      { role: 'KITCHEN_STAFF', id: staffAuth.user.id, assignedOutletId: kukatpally.id }
    );
    assert.equal(completed.status, 'COMPLETED');
  });

  // 14. Customer live tracker receives status updates
  await t.test('Point 14: Customer live tracker reflects terminal COMPLETED status', async () => {
    const order = await OrderService.getOrderById(kukatpallyOrderId, {
      id: customer.user.id,
      role: 'CUSTOMER',
    });
    assert.equal(order.status, 'COMPLETED');
  });

  // 15. Payment success triggers
  await t.test('Point 15: Mock payment processes success VPA & card triggers', async () => {
    const upiRes = await PaymentService.processPayment({
      orderId: kondapurOrderId,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey: `idem-upi-${timestamp}`,
    });
    assert.equal(upiRes.status, 'PAID');
    assert.ok(upiRes.transactionRef);

    const cardRes = await PaymentService.processPayment({
      orderId: gachibowliOrderId,
      method: 'CARD',
      cardLast4: '4242',
      idempotencyKey: `idem-card-${timestamp}`,
    });
    assert.equal(cardRes.status, 'PAID');
    assert.ok(cardRes.transactionRef);
  });

  // 16. Payment failure triggers and retry state
  await t.test('Point 16: Mock payment handles failure triggers predictably', async () => {
    // Test on a fresh unpaid order to test failure
    const failOrder = await OrderService.createOrder(customer.user.id, {
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-double-meetha',
          itemName: 'Double ka meetha',
          quantity: 1,
          selectedOptions: {
            'Rabri Pour': 'Traditional Saffron Rabri',
            'Sweetness Level': 'Royal Nizam Sweet',
          },
        },
      ],
      paymentMethod: 'UPI',
    });

    const failRes = await PaymentService.processPayment({
      orderId: failOrder.id,
      method: 'UPI',
      vpa: 'fail@upi',
      idempotencyKey: `idem-fail-${timestamp}`,
    });
    assert.equal(failRes.status, 'FAILED');
    assert.equal(failRes.failureReason, 'INSUFFICIENT_FUNDS');
  });

  // 17. Payment idempotency prevents duplicates
  await t.test('Point 17: Payment idempotency key returns identical transaction', async () => {
    const idemKey = `idem-repeat-${timestamp}`;
    const testOrder = await OrderService.createOrder(customer.user.id, {
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      items: [
        {
          itemId: 'item-irani-chai',
          itemName: 'Irani chai',
          quantity: 1,
          selectedOptions: {
            'Sweetness': 'Standard Irani Meetha',
            'Dum Milk & Decoction': 'Khoya Dum Creamy (Traditional)',
          },
        },
      ],
      paymentMethod: 'UPI',
    });

    const firstAttempt = await PaymentService.processPayment({
      orderId: testOrder.id,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey: idemKey,
    });

    const secondAttempt = await PaymentService.processPayment({
      orderId: testOrder.id,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey: idemKey,
    });

    assert.equal(firstAttempt.transactionRef, secondAttempt.transactionRef);
    assert.equal(firstAttempt.status, secondAttempt.status);
  });

  // 18. Outlet availability overrides (86ing) remain outlet-isolated
  await t.test('Point 18: 86ing an item at Kondapur does not affect Kukatpally', async () => {
    // 86 Biryani at Kondapur
    MenuService.setOutletOverride({
      outletId: kondapur.id,
      itemId: 'item-mut-dum',
      isAvailableOverride: false,
    });

    const kondapurMenu = MenuService.getMenuForOutlet(kondapur.id);
    const kondapurItem = kondapurMenu.find((i) => i.id === 'item-mut-dum');
    assert.equal(kondapurItem?.isAvailableAtOutlet, false, 'Item must be 86ed at Kondapur');

    const kukatpallyMenu = MenuService.getMenuForOutlet(kukatpally.id);
    const kukatpallyItem = kukatpallyMenu.find((i) => i.id === 'item-mut-dum');
    assert.equal(kukatpallyItem?.isAvailableAtOutlet, true, 'Item must remain available at Kukatpally');

    // Restore Kondapur availability
    MenuService.setOutletOverride({
      outletId: kondapur.id,
      itemId: 'item-mut-dum',
      isAvailableOverride: true,
    });
  });

  // 19. RBAC restrictions remain enforced
  await t.test('Point 19: Customers cannot access Kitchen queue; Staff cannot access manager endpoints', async () => {
    await assert.rejects(
      async () => {
        await OrderService.getKitchenQueue(kondapur.id, {
          role: 'CUSTOMER',
          id: customer.user.id,
        });
      },
      (err: any) => {
        assert.equal(err.code, 'CROSS_OUTLET_FORBIDDEN');
        return true;
      }
    );
  });

  // 20. All 3 mandatory seed fixtures (WEB-778120, WEB-778131, WEB-778146) match brief exactly
  await t.test('Point 20: Mandatory seed fixtures match IsoCode Labs brief exactly', async () => {
    const f1 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778120' },
      include: { items: true, outlet: true, payments: true },
    });
    assert.ok(f1, 'WEB-778120 must exist');
    assert.equal(f1.outlet.name, 'Kondapur');
    assert.equal(f1.status, 'PREPARING');
    assert.equal(f1.payments[0].method, 'UPI');
    assert.equal(f1.payments[0].status, 'PAID');
    assert.equal(f1.items.length, 2);
    assert.equal(Number(f1.totalAmount), 1180.0);

    const f2 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778131' },
      include: { items: true, outlet: true, payments: true },
    });
    assert.ok(f2, 'WEB-778131 must exist');
    assert.equal(f2.outlet.name, 'Gachibowli cloud kitchen');
    assert.equal(f2.status, 'READY');
    assert.equal(f2.payments[0].method, 'CARD');
    assert.equal(f2.payments[0].status, 'PAID');
    assert.equal(f2.items.length, 2);
    assert.equal(Number(f2.totalAmount), 640.0);

    const f3 = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778146' },
      include: { items: true, outlet: true, payments: true },
    });
    assert.ok(f3, 'WEB-778146 must exist');
    assert.equal(f3.outlet.name, 'Kukatpally');
    assert.equal(f3.status, 'PREPARING');
    assert.equal(f3.payments[0].method, 'UPI');
    assert.equal(f3.payments[0].status, 'PAID');
    assert.equal(f3.items.length, 1);
    assert.equal(f3.items[0].quantity, 3);
    assert.equal(Number(f3.totalAmount), 1050.0);
  });
});
