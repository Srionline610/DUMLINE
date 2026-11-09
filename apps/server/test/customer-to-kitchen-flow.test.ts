import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/prisma/client';
import { AuthService } from '../src/services/auth.service';
import { OrderService } from '../src/services/order.service';
import { PaymentService } from '../src/services/payment.service';
import { OutletService } from '../src/services/outlet.service';

test('Full Customer to Kitchen Flow & Order History Verification', async (t) => {
  const timestamp = Date.now();
  const testCustomerEmail = `cust-kds-${timestamp}@test.com`;
  const testPassword = 'Password@2026';

  // 1. Get Outlets
  const outlets = await OutletService.listOutlets(true);
  assert.ok(outlets.length > 0, 'Active outlets must exist');
  const kondapur = outlets.find((o) => o.slug === 'kondapur') || outlets[0];
  const gachibowli = outlets.find((o) => o.slug === 'gachibowli-cloud-kitchen') || outlets[1];

  // 2. Register / Authenticate Customer
  const custAuth = await AuthService.register({
    email: testCustomerEmail,
    phone: `+9191${timestamp.toString().slice(-8)}`,
    password: testPassword,
    fullName: 'Test KDS Customer',
    marketingConsent: false,
  });
  assert.ok(custAuth.token, 'Customer token must be issued');
  assert.equal(custAuth.user.role, 'CUSTOMER');

  let createdOrderId = '';

  await t.test('1. Customer places order and completes payment', async () => {
    const order = await OrderService.createOrder(custAuth.user.id, {
      outletId: kondapur.id,
      fulfillmentType: 'DELIVERY',
      items: [
        {
          itemId: 'item-mut-dum',
          itemName: 'Mutton dum biryani',
          quantity: 2,
          selectedOptions: { spiceLevel: 'ROYAL_SPICY', portionSize: 'PORTION_FAMILY' },
        },
        {
          itemId: 'item-mut-haleem',
          itemName: 'Mutton haleem',
          quantity: 1,
        },
      ],
      deliveryAddress: {
        line1: 'Road 36, Jubilee Hills',
        city: 'Hyderabad',
        distanceKm: 3.5,
      },
      paymentMethod: 'UPI',
    });

    assert.ok(order.id, 'Order must be created');
    assert.equal(order.status, 'PLACED', 'Initial order status must be PLACED');
    assert.equal(order.outletId, kondapur.id, 'Order must be bound to Kondapur');
    createdOrderId = order.id;

    // Process Mock Payment
    const payment = await PaymentService.processPayment({
      orderId: order.id,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey: `pay-${timestamp}`,
    });

    assert.equal(payment.status, 'PAID', 'Payment must succeed');
    assert.ok(payment.transactionRef, 'Transaction ref must be generated');
  });

  await t.test('2. Customer can retrieve placed order in My Orders history', async () => {
    const history = await OrderService.listOrders({
      id: custAuth.user.id,
      role: 'CUSTOMER',
    });

    assert.ok(history.length >= 1, 'Customer must have at least 1 order in history');
    const myOrder = history.find((o) => o.id === createdOrderId);
    assert.ok(myOrder, 'Created order must be found in customer history');
    assert.equal(myOrder.status, 'PLACED');
    assert.equal(myOrder.items.length, 2);
    assert.equal(myOrder.payments[0]?.status, 'PAID');
  });

  let kondapurStaffToken = '';
  let kondapurStaffUser: any = null;

  await t.test('3. Kitchen Staff for Kondapur logs in and sees order in KDS queue', async () => {
    const staffLogin = await AuthService.login({
      emailOrPhone: 'staff.kondapur@dumline.com',
      password: 'Staff@123',
    });

    assert.equal(staffLogin.user.role, 'KITCHEN_STAFF');
    kondapurStaffToken = staffLogin.token;
    kondapurStaffUser = staffLogin.user;
    assert.equal(kondapurStaffUser.assignedOutletId, kondapur.id, 'Staff must be assigned to Kondapur');

    // Fetch Kitchen Queue
    const queue = await OrderService.getKitchenQueue(kondapur.id, {
      id: kondapurStaffUser.id,
      role: kondapurStaffUser.role,
      assignedOutletId: kondapurStaffUser.assignedOutletId,
    });

    const foundInQueue = queue.find((o) => o.id === createdOrderId);
    assert.ok(foundInQueue, 'Newly PLACED order MUST be visible in kitchen queue for Kondapur');
    assert.equal(foundInQueue.status, 'PLACED', 'Queue order status must be PLACED');
    assert.equal(foundInQueue.items.length, 2);
  });

  await t.test('4. Cross-outlet isolation: Staff from Gachibowli cannot see Kondapur order', async () => {
    const gachiLogin = await AuthService.login({
      emailOrPhone: 'staff.gachibowli@dumline.com',
      password: 'Staff@123',
    });

    assert.equal(gachiLogin.user.role, 'KITCHEN_STAFF');
    assert.equal(gachiLogin.user.assignedOutletId, gachibowli.id);

    // Gachibowli staff attempts to fetch Gachibowli queue -> order must NOT be there
    const gachiQueue = await OrderService.getKitchenQueue(gachibowli.id, {
      id: gachiLogin.user.id,
      role: gachiLogin.user.role,
      assignedOutletId: gachiLogin.user.assignedOutletId,
    });

    const shouldNotExist = gachiQueue.find((o) => o.id === createdOrderId);
    assert.equal(shouldNotExist, undefined, 'Gachibowli staff must not see Kondapur orders');

    // Gachibowli staff attempts to query Kondapur queue -> MUST be rejected with HTTP 403
    await assert.rejects(
      async () => {
        await OrderService.getKitchenQueue(kondapur.id, {
          id: gachiLogin.user.id,
          role: gachiLogin.user.role,
          assignedOutletId: gachiLogin.user.assignedOutletId,
        });
      },
      { name: 'AppError', message: 'Staff is isolated to their assigned outlet queue only' }
    );
  });

  await t.test('5. Kitchen Staff accepts order (PLACED -> ACCEPTED)', async () => {
    const updated = await OrderService.updateOrderStatus(
      createdOrderId,
      'ACCEPTED',
      'Acknowledged by Kondapur kitchen staff',
      {
        id: kondapurStaffUser.id,
        role: kondapurStaffUser.role,
        assignedOutletId: kondapurStaffUser.assignedOutletId,
      }
    );

    assert.equal(updated.status, 'ACCEPTED');

    // Customer checks their order
    const custView = await OrderService.getOrderById(createdOrderId, {
      id: custAuth.user.id,
      role: 'CUSTOMER',
    });
    assert.equal(custView.status, 'ACCEPTED', 'Customer must see updated status ACCEPTED');
  });

  await t.test('6. Kitchen Staff starts cooking (ACCEPTED -> PREPARING)', async () => {
    const updated = await OrderService.updateOrderStatus(
      createdOrderId,
      'PREPARING',
      'Dum handi placed on live coals',
      {
        id: kondapurStaffUser.id,
        role: kondapurStaffUser.role,
        assignedOutletId: kondapurStaffUser.assignedOutletId,
      }
    );

    assert.equal(updated.status, 'PREPARING');

    const custView = await OrderService.getOrderById(createdOrderId, {
      id: custAuth.user.id,
      role: 'CUSTOMER',
    });
    assert.equal(custView.status, 'PREPARING', 'Customer must see updated status PREPARING');
  });

  await t.test('7. Kitchen Staff marks order ready (PREPARING -> READY)', async () => {
    const updated = await OrderService.updateOrderStatus(
      createdOrderId,
      'READY',
      'Packed with garnishes and salan',
      {
        id: kondapurStaffUser.id,
        role: kondapurStaffUser.role,
        assignedOutletId: kondapurStaffUser.assignedOutletId,
      }
    );

    assert.equal(updated.status, 'READY');

    const custView = await OrderService.getOrderById(createdOrderId, {
      id: custAuth.user.id,
      role: 'CUSTOMER',
    });
    assert.equal(custView.status, 'READY', 'Customer must see updated status READY');
  });

  await t.test('8. Kitchen Staff marks order completed (READY -> COMPLETED)', async () => {
    const updated = await OrderService.updateOrderStatus(
      createdOrderId,
      'COMPLETED',
      'Order handed over to delivery dispatch',
      {
        id: kondapurStaffUser.id,
        role: kondapurStaffUser.role,
        assignedOutletId: kondapurStaffUser.assignedOutletId,
      }
    );

    assert.equal(updated.status, 'COMPLETED');

    const custView = await OrderService.getOrderById(createdOrderId, {
      id: custAuth.user.id,
      role: 'CUSTOMER',
    });
    assert.equal(custView.status, 'COMPLETED', 'Customer must see updated status COMPLETED');
  });

  // Cleanup test order
  await prisma.order.delete({ where: { id: createdOrderId } }).catch(() => {});
  await prisma.user.delete({ where: { id: custAuth.user.id } }).catch(() => {});
});
