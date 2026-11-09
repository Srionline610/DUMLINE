import test from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'http';
import app from '../src/app';

function makeRequest(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const port = addr.port;

      const reqBodyStr = options.body ? JSON.stringify(options.body) : undefined;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(reqBodyStr ? { 'Content-Length': Buffer.byteLength(reqBodyStr).toString() } : {}),
      };

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: options.path,
          method: options.method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close();
            let parsedBody = data;
            try {
              parsedBody = JSON.parse(data);
            } catch {}
            resolve({
              statusCode: res.statusCode || 500,
              headers: res.headers,
              body: parsedBody,
            });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (reqBodyStr) {
        req.write(reqBodyStr);
      }
      req.end();
    });
  });
}

test('Phase 6: Full Customer E2E Workflow & Edge Cases', async (t) => {
  let customerToken: string;
  let testOutlet: any;
  let otherOutlet: any;
  let createdOrderId: string;
  const idempotencyKey = `idemp-e2e-${Date.now()}`;

  await t.test('1. Setup test customer authentication via registration', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: `cust-${Date.now()}@test.com`,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'Test Customer E2E',
        marketingConsent: false,
      },
    });

    if (res.statusCode !== 201) {
      console.error('SUBTEST 8 FAILED STATUS:', res.statusCode, 'BODY:', JSON.stringify(res.body));
    }
    assert.equal(res.statusCode, 201);
    assert.ok(res.body.data.token);
    customerToken = res.body.data.token;
  });

  await t.test('2. Public guest outlet browsing returns active outlets', async () => {
    const res = await makeRequest({
      method: 'GET',
      path: '/api/outlets',
    });
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 2);

    testOutlet = res.body.data[0];
    otherOutlet = res.body.data[1];
    assert.ok(testOutlet, 'Test outlet exists');
    assert.ok(otherOutlet, 'Other outlet exists');
  });

  await t.test('3. Guest menu browsing with outlet-specific pricing & availability', async () => {
    const res = await makeRequest({
      method: 'GET',
      path: `/api/menu?outletId=${testOutlet.id}`,
    });
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));

    const biryaniGroup = res.body.data.find((g: any) => g.category.includes('Biryani'));
    assert.ok(biryaniGroup, 'Biryani group exists');
    assert.ok(biryaniGroup.items.length > 0);
  });

  await t.test('4. Edge case: Empty cart validation is rejected', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/cart/validate',
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'PICKUP',
        items: [],
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, 'VALIDATION_ERROR');
  });

  await t.test('5. Edge case: Delivery address outside service radius is rejected', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/cart/validate',
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'DELIVERY',
        items: [
          {
            itemId: 'item-mut-dum',
            itemName: 'Mutton dum biryani',
            quantity: 1,
          },
        ],
        deliveryAddress: {
          line1: 'Faraway suburb beyond delivery radius',
          city: 'Hyderabad',
          distanceKm: 25.0, // Exceeds outlet radius!
        },
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, 'OUTSIDE_DELIVERY_RADIUS');
  });

  await t.test('6. Cart pricing validation with GST-inclusive breakdown & customization options', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/cart/validate',
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'DELIVERY',
        items: [
          {
            itemId: 'item-chk-dum-fam',
            itemName: 'Chicken dum biryani family pack',
            quantity: 1,
            selectedOptions: {
              Spice: 'Shahi Spicy',
              Accompaniment: 'Extra Mirchi Ka Salan',
            },
          },
          {
            itemId: 'item-double-meetha',
            itemName: 'Double ka meetha',
            quantity: 2,
          },
        ],
        deliveryAddress: {
          line1: 'Road No 36, Hyderabad',
          city: 'Hyderabad',
          distanceKm: 2.5, // Within 3km free radius!
        },
      },
    });

    assert.equal(res.statusCode, 200);
    const summary = res.body.data;

    // Item 1: 1180.00, Item 2: 90 * 2 = 180.00 -> Subtotal = 1360.00
    assert.equal(summary.subtotal, 1360.0);
    assert.equal(summary.deliveryFee, 30.0); // Base simulated delivery fee
    assert.equal(summary.totalAmount, 1390.0);

    // GST compliance check: subtotal must equal netBaseAmount + gstAmount
    const basePlusGst = Math.round((summary.netBaseAmount + summary.gstAmount) * 100) / 100;
    assert.equal(basePlusGst, summary.subtotal);
  });

  await t.test('7. Edge case: Unauthenticated order placement is rejected (401)', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/orders',
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'PICKUP',
        paymentMethod: 'UPI',
        items: [
          {
            itemId: 'item-mut-dum',
            itemName: 'Mutton dum biryani',
            quantity: 1,
          },
        ],
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, 'AUTH_REQUIRED');
  });

  await t.test('8. Order creation with mandatory customer auth & AI prep estimation', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/orders',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'UPI',
        items: [
          {
            itemId: 'item-chk-dum-fam',
            itemName: 'Chicken dum biryani family pack',
            quantity: 1,
            selectedOptions: { Spice: 'Shahi Spicy' },
          },
        ],
        deliveryAddress: {
          line1: 'Plot 42, Jubilee Hills',
          city: 'Hyderabad',
          distanceKm: 2.0,
        },
      },
    });

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.status, 'PLACED');
    assert.equal(res.body.data.subtotal, 1180.0);
    assert.equal(res.body.data.deliveryFee, 30.0);
    assert.equal(res.body.data.totalAmount, 1210.0);
    createdOrderId = res.body.data.id;

    // Verify promised time >= 20m minimum floor
    const placedMs = new Date(res.body.data.placedAt).getTime();
    const promisedMs = new Date(res.body.data.promisedTime).getTime();
    const diffMinutes = Math.round((promisedMs - placedMs) / 60000);
    assert.ok(diffMinutes >= testOutlet.minPrepMinutes);
  });

  await t.test('9. Mock payment failure simulation with retry support', async () => {
    const failRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId: createdOrderId,
        method: 'UPI',
        vpa: 'fail@upi',
      },
    });

    assert.equal(failRes.statusCode, 402);
    assert.equal(failRes.body.data.status, 'FAILED');
    assert.ok(failRes.body.data.failureReason);

    // Order status must remain PLACED (not advanced)
    const orderCheck = await makeRequest({
      method: 'GET',
      path: `/api/orders/${createdOrderId}`,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(orderCheck.body.data.status, 'PLACED');
  });

  await t.test('10. Mock payment success & idempotency caching', async () => {
    const successRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId: createdOrderId,
        method: 'UPI',
        vpa: 'success@upi',
        idempotencyKey,
      },
    });

    assert.equal(successRes.statusCode, 200);
    assert.equal(successRes.body.data.status, 'PAID');
    assert.ok(successRes.body.data.transactionRef);

    // Repeated submission with same idempotencyKey returns cached response
    const repeatedRes = await makeRequest({
      method: 'POST',
      path: '/api/payments',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId: createdOrderId,
        method: 'UPI',
        vpa: 'success@upi',
        idempotencyKey,
      },
    });

    assert.equal(repeatedRes.statusCode, 200);
    assert.equal(repeatedRes.body.data.transactionRef, successRes.body.data.transactionRef);
  });

  await t.test('11. Order state machine: PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED', async () => {
    // Register staff for testOutlet
    const staffRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: `staff-${Date.now()}@test.com`,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'Test Kitchen Lead',
        role: 'KITCHEN_STAFF',
        assignedOutletId: testOutlet.id,
      },
    });
    assert.equal(staffRes.statusCode, 201);
    const staffToken = staffRes.body.data.token;

    // 1. ACCEPTED
    const s1 = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${createdOrderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'ACCEPTED' },
    });
    assert.equal(s1.statusCode, 200);
    assert.equal(s1.body.data.status, 'ACCEPTED');

    // 2. PREPARING
    const s2 = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${createdOrderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'PREPARING' },
    });
    assert.equal(s2.statusCode, 200);
    assert.equal(s2.body.data.status, 'PREPARING');

    // 3. READY
    const s3 = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${createdOrderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'READY' },
    });
    assert.equal(s3.statusCode, 200);
    assert.equal(s3.body.data.status, 'READY');

    // 4. COMPLETED
    const s4 = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${createdOrderId}/status`,
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'COMPLETED' },
    });
    assert.equal(s4.statusCode, 200);
    assert.equal(s4.body.data.status, 'COMPLETED');
  });

  await t.test('12. Edge case: Invalid transition from terminal COMPLETED state is rejected (409)', async () => {
    const adminRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: `admin-${Date.now()}@test.com`,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'Test Central Admin',
        role: 'ADMIN',
      },
    });
    assert.equal(adminRes.statusCode, 201);
    const adminToken = adminRes.body.data.token;

    const res = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${createdOrderId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'PREPARING' },
    });

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'INVALID_STATUS_TRANSITION');
  });

  await t.test('13. Cross-outlet isolation: Staff cannot access orders of another outlet (403)', async () => {
    // Staff assigned to testOutlet attempting to view otherOutlet
    const staffRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: `staff-iso-${Date.now()}@test.com`,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'Staff Iso Test',
        role: 'KITCHEN_STAFF',
        assignedOutletId: testOutlet.id,
      },
    });
    assert.equal(staffRes.statusCode, 201);
    const staffToken = staffRes.body.data.token;

    const res = await makeRequest({
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${otherOutlet.id}`,
      headers: { Authorization: `Bearer ${staffToken}` },
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  await t.test('14. Manager prep-time override with mandatory audit reason', async () => {
    // Create new order
    const orderRes = await makeRequest({
      method: 'POST',
      path: '/api/orders',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        outletId: testOutlet.id,
        fulfillmentType: 'PICKUP',
        paymentMethod: 'CARD',
        items: [{ itemId: 'item-veg-biryani', itemName: 'Veg biryani', quantity: 2 }],
      },
    });
    assert.equal(orderRes.statusCode, 201);
    const orderId = orderRes.body.data.id;

    // Register manager assigned to testOutlet
    const mgrRes = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: `mgr-${Date.now()}@test.com`,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'Test Outlet Manager',
        role: 'OUTLET_MANAGER',
        assignedOutletId: testOutlet.id,
      },
    });
    assert.equal(mgrRes.statusCode, 201);
    const mgrToken = mgrRes.body.data.token;

    // Override promised time to 45 mins from now
    const newPromised = new Date(Date.now() + 45 * 60000).toISOString();
    const overrideRes = await makeRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId}/prep-time`,
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: {
        promisedTime: newPromised,
        reason: 'Large wedding party dum handi batch requirement',
      },
    });

    assert.equal(overrideRes.statusCode, 200);
    assert.equal(overrideRes.body.data.promisedTime, newPromised);
  });
});
