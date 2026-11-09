import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import prisma from '../src/prisma/client';

describe('Mandatory Seed Fixtures Verification', () => {
  test('Fixture WEB-778120 matches the assessment brief exactly', async () => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778120' },
      include: { items: true, payments: true, outlet: true },
    });

    assert.ok(order, 'WEB-778120 must exist in database');
    assert.strictEqual(order!.outlet.name, 'Kondapur');
    assert.strictEqual(Number(order!.totalAmount), 1180.0);
    assert.strictEqual(order!.status, 'PREPARING');
    assert.strictEqual(order!.payments[0].method, 'UPI');
    assert.strictEqual(order!.payments[0].status, 'PAID');

    const itemNames = order!.items.map((i) => i.itemName);
    assert.ok(itemNames.includes('Chicken dum biryani family pack'));
    assert.ok(itemNames.includes('Double ka meetha'));
  });

  test('Fixture WEB-778131 matches the assessment brief exactly', async () => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778131' },
      include: { items: true, payments: true, outlet: true },
    });

    assert.ok(order, 'WEB-778131 must exist in database');
    assert.strictEqual(order!.outlet.name, 'Gachibowli cloud kitchen');
    assert.strictEqual(Number(order!.totalAmount), 640.0);
    assert.strictEqual(order!.status, 'READY');
    assert.strictEqual(order!.payments[0].method, 'CARD');
    assert.strictEqual(order!.payments[0].status, 'PAID');

    const itemNames = order!.items.map((i) => i.itemName);
    assert.ok(itemNames.includes('Veg biryani'));
    assert.ok(itemNames.includes('Mirchi ka salan'));
  });

  test('Fixture WEB-778146 matches the assessment brief exactly', async () => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'WEB-778146' },
      include: { items: true, payments: true, outlet: true },
    });

    assert.ok(order, 'WEB-778146 must exist in database');
    assert.strictEqual(order!.outlet.name, 'Kukatpally');
    assert.strictEqual(Number(order!.totalAmount), 1050.0);
    assert.strictEqual(order!.status, 'PREPARING');
    assert.strictEqual(order!.payments[0].method, 'UPI');
    assert.strictEqual(order!.payments[0].status, 'PAID');

    const itemNames = order!.items.map((i) => i.itemName);
    assert.ok(itemNames.includes('Mutton haleem'));
    const haleem = order!.items.find((i) => i.itemName === 'Mutton haleem');
    assert.strictEqual(haleem!.quantity, 3);
  });
});

