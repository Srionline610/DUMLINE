import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'http';
import app from '../src/app';

// Helper to make local HTTP requests to Express app without binding a real external port
function request(
  appInstance: any,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appInstance);
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

describe('REST API End-to-End Integration', () => {
  test('GET /health returns server health and timestamp', async () => {
    const res = await request(app, { method: 'GET', path: '/health' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('Public guest browsing: GET /api/outlets and GET /api/menu', async () => {
    const outletsRes = await request(app, { method: 'GET', path: '/api/outlets' });
    assert.strictEqual(outletsRes.statusCode, 200);
    assert.ok(Array.isArray(outletsRes.body.data));
    assert.ok(outletsRes.body.data.length > 0);

    const menuRes = await request(app, { method: 'GET', path: '/api/menu' });
    assert.strictEqual(menuRes.statusCode, 200);
    assert.ok(Array.isArray(menuRes.body.data));
    const categories = menuRes.body.data.map((c: any) => c.category);
    assert.ok(categories.includes('Biryani & Rice'));
  });

  test('Complete Customer Order & Checkout Lifecycle via HTTP', async () => {
    // 1. Register a new customer
    const userEmail = `e2e-customer-${Date.now()}@example.com`;
    const regRes = await request(app, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        email: userEmail,
        phone: `+91${Date.now().toString().slice(-10)}`,
        password: 'Password@2026',
        fullName: 'E2E Customer',
        marketingConsent: false,
      },
    });

    assert.strictEqual(regRes.statusCode, 201);
    const token = regRes.body.data.token;
    assert.ok(token);

    // 2. Validate Cart
    const outletsRes = await request(app, { method: 'GET', path: '/api/outlets' });
    const outlet = outletsRes.body.data[0];

    const cartRes = await request(app, {
      method: 'POST',
      path: '/api/cart/validate',
      body: {
        outletId: outlet.id,
        fulfillmentType: 'DELIVERY',
        items: [
          {
            itemId: 'item-veg-biryani',
            itemName: 'Veg biryani',
            quantity: 2,
          },
        ],
        deliveryAddress: {
          line1: 'Road No 36, Jubilee Hills',
          distanceKm: 2.0,
        },
      },
    });
    assert.strictEqual(cartRes.statusCode, 200);
    assert.strictEqual(cartRes.body.data.subtotal, 560.0); // 2 * 280

    // 3. Create Order (requires auth token)
    const orderRes = await request(app, {
      method: 'POST',
      path: '/api/orders',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        outletId: outlet.id,
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'UPI',
        items: [
          {
            itemId: 'item-veg-biryani',
            itemName: 'Veg biryani',
            quantity: 2,
          },
        ],
        deliveryAddress: {
          line1: 'Road No 36, Jubilee Hills',
          distanceKm: 2.0,
        },
      },
    });
    assert.strictEqual(orderRes.statusCode, 201);
    const orderId = orderRes.body.data.id;
    assert.strictEqual(orderRes.body.data.status, 'PLACED');

    // 4. Pay for Order via Mock Payment (success@upi)
    const payRes = await request(app, {
      method: 'POST',
      path: '/api/payments',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        orderId,
        method: 'UPI',
        vpa: 'success@upi',
        idempotencyKey: `idemp-e2e-${Date.now()}`,
      },
    });
    assert.strictEqual(payRes.statusCode, 200);
    assert.strictEqual(payRes.body.data.status, 'PAID');

    // 5. Fetch Order details
    const getOrderRes = await request(app, {
      method: 'GET',
      path: `/api/orders/${orderId}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(getOrderRes.statusCode, 200);
    assert.strictEqual(getOrderRes.body.data.id, orderId);
    assert.strictEqual(getOrderRes.body.data.payments.length, 1);
    assert.strictEqual(getOrderRes.body.data.payments[0].status, 'PAID');
  });

  test('Unauthenticated request to POST /api/orders returns 401 AUTH_REQUIRED', async () => {
    const res = await request(app, {
      method: 'POST',
      path: '/api/orders',
      body: {
        outletId: 'random-outlet',
        fulfillmentType: 'PICKUP',
        paymentMethod: 'UPI',
        items: [{ itemId: 'item-veg-biryani', itemName: 'Veg biryani', quantity: 1 }],
      },
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.code, 'AUTH_REQUIRED');
  });
});

