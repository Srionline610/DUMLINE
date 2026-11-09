import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'http';
import app from '../src/app';
import { signJwt } from '../src/utils/crypto';
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

describe('Enterprise RBAC & Outlet Isolation Security Suite', () => {
  const JUBILEE_ID = 'out-jubilee-001';
  const BANJARA_ID = 'out-banjara-002';

  // Tokens
  const customerToken = signJwt(
    { sub: 'test-cust-id', email: 'cust@test.com', phone: '+919999900001', role: 'CUSTOMER', assignedOutletId: null },
    3600
  );

  const jubileeStaffToken = signJwt(
    { sub: 'test-staff-jubilee', email: 'staff.jubilee@dumline.com', phone: '+919999900002', role: 'KITCHEN_STAFF', assignedOutletId: JUBILEE_ID },
    3600
  );

  const jubileeManagerToken = signJwt(
    { sub: 'test-mgr-jubilee', email: 'mgr.jubilee@dumline.com', phone: '+919999900003', role: 'OUTLET_MANAGER', assignedOutletId: JUBILEE_ID },
    3600
  );

  const centralAdminToken = signJwt(
    { sub: 'test-admin-id', email: 'admin@dumline.com', phone: '+919999900004', role: 'ADMIN', assignedOutletId: null },
    3600
  );

  test('1. Unauthenticated request to kitchen queue returns 401 AUTH_REQUIRED', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${JUBILEE_ID}`,
    });
    assert.strictEqual(res.statusCode, 401);
  });

  test('2. Unauthenticated request to admin staff assignments returns 401 AUTH_REQUIRED', async () => {
    const res = await request(app, {
      method: 'GET',
      path: '/api/admin/staff-assignments',
    });
    assert.strictEqual(res.statusCode, 401);
  });

  test('3. Customer token accessing kitchen queue is blocked with 403 ROLE_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${JUBILEE_ID}`,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'ROLE_FORBIDDEN');
  });

  test('4. Customer token accessing central admin endpoints is blocked with 403 ROLE_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: '/api/admin/staff-assignments',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'ROLE_FORBIDDEN');
  });

  test('5. Kitchen Staff token accessing central admin endpoints is blocked with 403 ROLE_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: '/api/admin/staff-assignments',
      headers: { Authorization: `Bearer ${jubileeStaffToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'ROLE_FORBIDDEN');
  });

  test('6. Kitchen Staff assigned to Jubilee Hills attempting Banjara Hills queue is blocked with 403 CROSS_OUTLET_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${BANJARA_ID}`,
      headers: { Authorization: `Bearer ${jubileeStaffToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  test('7. Kitchen Staff assigned to Jubilee Hills successfully reads Jubilee Hills queue', async () => {
    const res = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${JUBILEE_ID}`,
      headers: { Authorization: `Bearer ${jubileeStaffToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  test('8. Outlet Manager for Jubilee Hills attempting to PATCH Banjara Hills outlet is blocked with 403 CROSS_OUTLET_FORBIDDEN', async () => {
    const res = await request(app, {
      method: 'PATCH',
      path: `/api/outlets/${BANJARA_ID}`,
      headers: { Authorization: `Bearer ${jubileeManagerToken}` },
      body: { minPrepMinutes: 25 },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'CROSS_OUTLET_FORBIDDEN');
  });

  test('9. Central Admin token can access cross-outlet queues without restriction', async () => {
    const resJubilee = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${JUBILEE_ID}`,
      headers: { Authorization: `Bearer ${centralAdminToken}` },
    });
    assert.strictEqual(resJubilee.statusCode, 200);

    const resBanjara = await request(app, {
      method: 'GET',
      path: `/api/orders/kitchen/queue?outletId=${BANJARA_ID}`,
      headers: { Authorization: `Bearer ${centralAdminToken}` },
    });
    assert.strictEqual(resBanjara.statusCode, 200);
  });

  test('10. Public registration defaults to CUSTOMER role when role is omitted', async () => {
    const email = `security-test-${Date.now()}@dumline.internal`;
    const reg = await AuthService.register({
      email,
      phone: `+9188${Date.now().toString().slice(-8)}`,
      password: 'SafePassword123!',
      fullName: 'Customer Default',
    });
    assert.strictEqual(reg.user.role, 'CUSTOMER', 'Registration without role must default to CUSTOMER');
  });
});
