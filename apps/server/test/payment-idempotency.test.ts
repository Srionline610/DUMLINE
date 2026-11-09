import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { PaymentService } from '../src/services/payment.service';
import { OrderService } from '../src/services/order.service';
import { AuthService } from '../src/services/auth.service';
import { OutletService } from '../src/services/outlet.service';

describe('Server-Side Mock Payment Contract & Idempotency', () => {
  test('UPI payment triggers succeed on success@upi and fail on fail@upi', async () => {
    // Register demo customer and get an outlet
    const customer = await AuthService.register({
      email: `payment-tester-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Payment Tester',
    });

    const outlets = await OutletService.listOutlets();
    const outlet = outlets[0];

    // Create an order
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

    // Test failure scenario: fail@upi
    const failedPayment = await PaymentService.processPayment({
      orderId: order.id,
      method: 'UPI',
      vpa: 'fail@upi',
    });
    assert.strictEqual(failedPayment.status, 'FAILED');
    assert.strictEqual(failedPayment.failureReason, 'INSUFFICIENT_FUNDS');

    // Test success scenario: success@upi
    const successfulPayment = await PaymentService.processPayment({
      orderId: order.id,
      method: 'UPI',
      vpa: 'success@upi',
    });
    assert.strictEqual(successfulPayment.status, 'PAID');
    assert.strictEqual(successfulPayment.failureReason, null);
    assert.ok(successfulPayment.transactionRef.startsWith('TXN-'));
  });

  test('Card payment triggers succeed on card ending 4242 and fail on 0002', async () => {
    const customer = await AuthService.register({
      email: `card-tester-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Card Tester',
    });

    const outlets = await OutletService.listOutlets();
    const outlet = outlets[0];

    const order = await OrderService.createOrder(customer.user.id, {
      outletId: outlet.id,
      fulfillmentType: 'PICKUP',
      paymentMethod: 'CARD',
      items: [
        {
          itemId: 'item-double-meetha',
          itemName: 'Double ka meetha',
          quantity: 1,
        },
      ],
    });

    // Card ending 0002 -> BANK_TIMEOUT
    const failedCard = await PaymentService.processPayment({
      orderId: order.id,
      method: 'CARD',
      cardLast4: '0002',
    });
    assert.strictEqual(failedCard.status, 'FAILED');
    assert.strictEqual(failedCard.failureReason, 'BANK_TIMEOUT');

    // Card ending 4242 -> PAID
    const successCard = await PaymentService.processPayment({
      orderId: order.id,
      method: 'CARD',
      cardLast4: '4242',
    });
    assert.strictEqual(successCard.status, 'PAID');
  });

  test('Payment idempotency returns cached response for repeated submission key', async () => {
    const customer = await AuthService.register({
      email: `idempotency-${Date.now()}@example.com`,
      phone: `+91${Date.now().toString().slice(-10)}`,
      password: 'SafePassword123!',
      fullName: 'Idempotency Tester',
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

    const idempotencyKey = `idemp-${Date.now()}`;

    // First submission
    const firstAttempt = await PaymentService.processPayment({
      orderId: order.id,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey,
    });

    // Second submission with exact same key
    const secondAttempt = await PaymentService.processPayment({
      orderId: order.id,
      method: 'UPI',
      vpa: 'success@upi',
      idempotencyKey,
    });

    assert.strictEqual(firstAttempt.paymentId, secondAttempt.paymentId, 'Idempotent call must return identical paymentId');
    assert.strictEqual(firstAttempt.transactionRef, secondAttempt.transactionRef, 'Must return same transactionRef');
  });
});

