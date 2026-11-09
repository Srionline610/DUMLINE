import { test, describe, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'http';
import app from '../src/app';
import prisma from '../src/prisma/client';
import { AuthService } from '../src/services/auth.service';

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

describe('Branch-Specific KDS and Centralized All-Kitchens Dashboard Test Suite', () => {
  let kondapurOutletId: string;
  let gachibowliOutletId: string;
  let kukatpallyOutletId: string;

  let adminToken: string;
  let kondapurStaffToken: string;
  let gachibowliStaffToken: string;
  let kukatpallyStaffToken: string;

  let kondapurOrder: any;
  let gachibowliOrder: any;
  let kukatpallyOrder: any;
  let originalKukatpallyStatus: any;

  before(async () => {
    // 1. Fetch Outlets
    const kondapur = await prisma.outlet.findFirst({ where: { slug: 'kondapur' } });
    const gachibowli = await prisma.outlet.findFirst({ where: { slug: 'gachibowli-cloud-kitchen' } });
    const kukatpally = await prisma.outlet.findFirst({ where: { slug: 'kukatpally' } });

    assert.ok(kondapur, 'Kondapur outlet must exist');
    assert.ok(gachibowli, 'Gachibowli outlet must exist');
    assert.ok(kukatpally, 'Kukatpally outlet must exist');

    kondapurOutletId = kondapur!.id;
    gachibowliOutletId = gachibowli!.id;
    kukatpallyOutletId = kukatpally!.id;

    // 2. Login to get authenticated tokens
    const adminLogin = await AuthService.login({
      emailOrPhone: 'admin@dumline.com',
      password: 'Admin@123',
    });
    adminToken = adminLogin.token;

    const kondapurLogin = await AuthService.login({
      emailOrPhone: 'staff.kondapur@dumline.com',
      password: 'Staff@123',
    });
    kondapurStaffToken = kondapurLogin.token;
    assert.strictEqual(
      kondapurLogin.user.assignedOutletId,
      kondapurOutletId,
      'Kondapur staff must be assigned to Kondapur outlet'
    );

    const gachibowliLogin = await AuthService.login({
      emailOrPhone: 'staff.gachibowli@dumline.com',
      password: 'Staff@123',
    });
    gachibowliStaffToken = gachibowliLogin.token;
    assert.strictEqual(
      gachibowliLogin.user.assignedOutletId,
      gachibowliOutletId,
      'Gachibowli staff must be assigned to Gachibowli outlet'
    );

    const kukatpallyLogin = await AuthService.login({
      emailOrPhone: 'staff.kukatpally@dumline.com',
      password: 'Staff@123',
    });
    kukatpallyStaffToken = kukatpallyLogin.token;
    assert.strictEqual(
      kukatpallyLogin.user.assignedOutletId,
      kukatpallyOutletId,
      'Kukatpally staff must be assigned to Kukatpally outlet'
    );

    // 3. Fetch orders for testing mutations
    kondapurOrder = await prisma.order.findFirst({ where: { outletId: kondapurOutletId } });
    gachibowliOrder = await prisma.order.findFirst({ where: { outletId: gachibowliOutletId } });
    kukatpallyOrder = await prisma.order.findFirst({ where: { outletId: kukatpallyOutletId } });
    if (kukatpallyOrder) {
      originalKukatpallyStatus = kukatpallyOrder.status;
    }
  });

  after(async () => {
    if (kukatpallyOrder && originalKukatpallyStatus) {
      try {
        await prisma.order.update({
          where: { id: kukatpallyOrder.id },
          data: { status: originalKukatpallyStatus },
        });
      } catch {}
    }
    await prisma.$disconnect();
  });

  // Test 1: Kondapur staff querying Kondapur queue succeeds
  test('Branch KDS: Kondapur staff can view Kondapur orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${kondapurOutletId}`,
      headers: { Authorization: `Bearer ${kondapurStaffToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    for (const order of res.body.data) {
      assert.strictEqual(
        order.outletId,
        kondapurOutletId,
        'Kondapur queue must only contain Kondapur orders'
      );
    }
  });

  // Test 2: Kondapur staff querying another outlet is forbidden (403)
  test('Branch KDS: Kondapur staff querying Kukatpally queue returns 403 CROSS_OUTLET_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${kukatpallyOutletId}`,
      headers: { Authorization: `Bearer ${kondapurStaffToken}` },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  // Test 3: Kondapur staff querying outletId=ALL is forbidden (403)
  test('Branch KDS: Kondapur staff querying outletId=ALL returns 403 CROSS_OUTLET_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=ALL`,
      headers: { Authorization: `Bearer ${kondapurStaffToken}` },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  // Test 4: Gachibowli staff querying Gachibowli queue returns only Gachibowli orders
  test('Branch KDS: Gachibowli staff sees only Gachibowli orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${gachibowliOutletId}`,
      headers: { Authorization: `Bearer ${gachibowliStaffToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(
        order.outletId,
        gachibowliOutletId,
        'Gachibowli queue must only contain Gachibowli orders'
      );
    }
  });

  // Test 5: Kukatpally staff querying Kukatpally queue returns only Kukatpally orders
  test('Branch KDS: Kukatpally staff sees only Kukatpally orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${kukatpallyOutletId}`,
      headers: { Authorization: `Bearer ${kukatpallyStaffToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(
        order.outletId,
        kukatpallyOutletId,
        'Kukatpally queue must only contain Kukatpally orders'
      );
    }
  });

  // Test 6: Central Admin querying outletId=ALL returns orders across all branches
  test('Centralized KDS: Central Admin querying outletId=ALL returns multi-branch orders without duplicates', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=ALL`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));

    // Verify deduplication
    const ids = res.body.data.map((o: any) => o.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'Queue items must not be duplicated');

    // Verify every order card has outletName
    for (const order of res.body.data) {
      assert.ok(order.outletName, 'All orders returned to Central Admin must have an outletName');
    }
  });

  // Test 7: Central Admin filtering to specific outlets works seamlessly
  test('Centralized KDS: Central Admin can drill down into Kondapur orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${kondapurOutletId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(order.outletId, kondapurOutletId);
    }
  });

  test('Centralized KDS: Central Admin can drill down into Gachibowli orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${gachibowliOutletId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(order.outletId, gachibowliOutletId);
    }
  });

  test('Centralized KDS: Central Admin can drill down into Kukatpally orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${kukatpallyOutletId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(order.outletId, kukatpallyOutletId);
    }
  });

  // Test 8: Status filtering for OVERDUE returns overdue orders
  test('Centralized KDS: Central Admin status filter status=OVERDUE returns overdue orders', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=ALL&status=OVERDUE`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    for (const order of res.body.data) {
      assert.strictEqual(order.isOverdue, true, 'All returned orders must be marked overdue');
    }
  });

  // Test 9: Cross-Outlet status mutation enforcement
  test('Security: Kondapur staff cannot update Kukatpally order status', async () => {
    if (!kukatpallyOrder) return;
    const res = await request(app, {
      method: 'PATCH',
      path: `/api/orders/${kukatpallyOrder.id}/status`,
      headers: { Authorization: `Bearer ${kondapurStaffToken}` },
      body: { status: 'READY' },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  test('Security: Central Admin can manage order status across branches', async () => {
    if (!kukatpallyOrder) return;
    // Attempting valid status transition or receiving status machine validation
    const res = await request(app, {
      method: 'PATCH',
      path: `/api/orders/${kukatpallyOrder.id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'READY' },
    });

    // Should not be rejected with 403 CROSS_OUTLET_FORBIDDEN
    assert.notStrictEqual(
      res.body.code,
      'CROSS_OUTLET_FORBIDDEN',
      'Central Admin must never be blocked by cross-outlet forbidden'
    );
  });
});
