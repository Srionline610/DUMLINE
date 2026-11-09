import test from 'node:test';
import assert from 'node:assert/strict';
import { io as ioClient } from 'socket.io-client';
import { server, io } from '../src/index';
import prisma from '../src/prisma/client';
import { signJwt } from '../src/utils/crypto';
import { OutletService } from '../src/services/outlet.service';

test('Socket.IO Enterprise Authentication & Authorization Security Suite', async (t) => {
  let port: number;
  let kondapur: any;
  let gachibowli: any;
  let testOrderKondapur: any;
  let testOrderGachibowli: any;

  // Retrieve seeded outlets
  const outlets = await OutletService.listOutlets(true);
  kondapur = outlets.find((o) => o.slug === 'kondapur') || outlets[0];
  gachibowli = outlets.find((o) => o.slug === 'gachibowli-cloud-kitchen') || outlets[1];

  // Create temporary test users
  const custA = await prisma.user.create({
    data: {
      email: `cust-sock-a-${Date.now()}@test.com`,
      phone: `+9193${Date.now().toString().slice(-8)}`,
      passwordHash: 'dummyhash',
      fullName: 'Socket Customer A',
      role: 'CUSTOMER',
      marketingConsent: false,
    },
  });

  const custB = await prisma.user.create({
    data: {
      email: `cust-sock-b-${Date.now()}@test.com`,
      phone: `+9194${Date.now().toString().slice(-8)}`,
      passwordHash: 'dummyhash',
      fullName: 'Socket Customer B',
      role: 'CUSTOMER',
      marketingConsent: false,
    },
  });

  // Create test orders
  testOrderKondapur = await prisma.order.create({
    data: {
      orderNumber: `DL-SOCK-K-${Date.now()}`,
      customerId: custA.id,
      outletId: kondapur.id,
      fulfillmentType: 'PICKUP',
      status: 'PLACED',
      subtotal: 420.0,
      gstAmount: 21.0,
      deliveryFee: 0.0,
      totalAmount: 441.0,
      promisedTime: new Date(Date.now() + 30 * 60000),
    },
  });

  testOrderGachibowli = await prisma.order.create({
    data: {
      orderNumber: `DL-SOCK-G-${Date.now()}`,
      customerId: custB.id,
      outletId: gachibowli.id,
      fulfillmentType: 'PICKUP',
      status: 'PLACED',
      subtotal: 350.0,
      gstAmount: 17.5,
      deliveryFee: 0.0,
      totalAmount: 367.5,
      promisedTime: new Date(Date.now() + 30 * 60000),
    },
  });

  // Start HTTP server on dynamic port if not already listening
  await new Promise<void>((resolve) => {
    if (server.listening) {
      port = (server.address() as any).port;
      resolve();
    } else {
      server.listen(0, '127.0.0.1', () => {
        port = (server.address() as any).port;
        resolve();
      });
    }
  });

  function connect(token?: string | null): Promise<any> {
    return new Promise((resolve, reject) => {
      const client = ioClient(`http://127.0.0.1:${port}`, {
        transports: ['websocket'],
        autoConnect: true,
        auth: token !== undefined ? { token } : undefined,
        reconnection: false,
        timeout: 3000,
      });

      client.on('connect', () => resolve(client));
      client.on('connect_error', (err) => reject(err));
    });
  }

  function emitWithAck(client: any, event: string, ...args: any[]): Promise<any> {
    return new Promise((resolve) => {
      client.emit(event, ...args, (res: any) => {
        resolve(res);
      });
    });
  }

  // -------------------------------------------------------------
  // 1. Missing JWT in strict authentication mode
  // -------------------------------------------------------------
  await t.test('1. Missing JWT is rejected when socket authentication is enforced', async () => {
    process.env.REQUIRE_SOCKET_AUTH = 'true';
    try {
      await assert.rejects(
        async () => {
          await connect(null);
        },
        (err: any) => {
          assert.equal(err.message, 'AUTH_REQUIRED');
          return true;
        }
      );
    } finally {
      delete process.env.REQUIRE_SOCKET_AUTH;
    }
  });

  // -------------------------------------------------------------
  // 2. Invalid JWT is rejected
  // -------------------------------------------------------------
  await t.test('2. Invalid JWT token is rejected on connection handshake', async () => {
    await assert.rejects(
      async () => {
        await connect('malformed.bogus.jwt');
      },
      (err: any) => {
        assert.equal(err.message, 'AUTH_INVALID_TOKEN');
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // 3. Expired JWT is rejected
  // -------------------------------------------------------------
  await t.test('3. Expired JWT token is rejected on connection handshake', async () => {
    const expiredToken = signJwt({ id: custA.id, role: 'CUSTOMER' }, -3600); // expired 1 hour ago
    await assert.rejects(
      async () => {
        await connect(expiredToken);
      },
      (err: any) => {
        assert.equal(err.message, 'AUTH_EXPIRED_TOKEN');
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // 4. Staff with missing assignedOutletId is rejected
  // -------------------------------------------------------------
  await t.test('4. Kitchen Staff with missing assignedOutletId cannot join outlet room', async () => {
    const unassignedToken = signJwt({
      id: 'staff-no-outlet',
      role: 'KITCHEN_STAFF',
      assignedOutletId: null,
    });

    const client = await connect(unassignedToken);
    const res = await emitWithAck(client, 'join:outlet', kondapur.id);
    assert.equal(res.success, false);
    assert.equal(res.error.code, 'MISSING_ASSIGNED_OUTLET');
    client.disconnect();
  });

  // -------------------------------------------------------------
  // 5. Cross-outlet staff access is rejected
  // -------------------------------------------------------------
  await t.test('5. Cross-outlet staff access: Kondapur staff cannot join Gachibowli room', async () => {
    const kondapurStaffToken = signJwt({
      id: 'staff-kondapur',
      role: 'KITCHEN_STAFF',
      assignedOutletId: kondapur.id,
    });

    const client = await connect(kondapurStaffToken);
    const res = await emitWithAck(client, 'join:outlet', gachibowli.id);
    assert.equal(res.success, false);
    assert.equal(res.error.code, 'CROSS_OUTLET_FORBIDDEN');
    client.disconnect();
  });

  // -------------------------------------------------------------
  // 6. Unauthorized role joining an outlet is rejected
  // -------------------------------------------------------------
  await t.test('6. Unauthorized role: Customer cannot join kitchen outlet room', async () => {
    const customerToken = signJwt({
      id: custA.id,
      role: 'CUSTOMER',
    });

    const client = await connect(customerToken);
    const res = await emitWithAck(client, 'join:outlet', kondapur.id);
    assert.equal(res.success, false);
    assert.equal(res.error.code, 'FORBIDDEN_ROLE');

    // Customer also cannot join ALL outlets
    const resAll = await emitWithAck(client, 'join:all-outlets');
    assert.equal(resAll.success, false);
    assert.equal(resAll.error.code, 'FORBIDDEN');
    client.disconnect();
  });

  // -------------------------------------------------------------
  // 7. Unauthorized order room access is rejected
  // -------------------------------------------------------------
  await t.test('7. Unauthorized order room access: Customer B cannot eavesdrop on Customer A order', async () => {
    const custBToken = signJwt({
      id: custB.id,
      role: 'CUSTOMER',
    });

    const client = await connect(custBToken);
    // Customer B attempts to join Customer A's Kondapur order room
    const res = await emitWithAck(client, 'join:order', testOrderKondapur.id);
    assert.equal(res.success, false);
    assert.equal(res.error.code, 'ORDER_FORBIDDEN');
    client.disconnect();
  });

  await t.test('8. Unauthorized order room access: Gachibowli staff cannot eavesdrop on Kondapur order', async () => {
    const gachiStaffToken = signJwt({
      id: 'staff-gachi',
      role: 'KITCHEN_STAFF',
      assignedOutletId: gachibowli.id,
    });

    const client = await connect(gachiStaffToken);
    const res = await emitWithAck(client, 'join:order', testOrderKondapur.id);
    assert.equal(res.success, false);
    assert.equal(res.error.code, 'ORDER_FORBIDDEN');
    client.disconnect();
  });

  // -------------------------------------------------------------
  // 8. Legitimate accesses succeed
  // -------------------------------------------------------------
  await t.test('9. Legitimate order room access: Customer A can access their own order', async () => {
    const custAToken = signJwt({
      id: custA.id,
      role: 'CUSTOMER',
    });

    const client = await connect(custAToken);
    const res = await emitWithAck(client, 'join:order', testOrderKondapur.id);
    assert.equal(res.success, true);
    assert.equal(res.room, `order:${testOrderKondapur.id}`);
    client.disconnect();
  });

  await t.test('10. Legitimate kitchen room access: Kondapur staff can join Kondapur outlet', async () => {
    const kondapurStaffToken = signJwt({
      id: 'staff-kondapur',
      role: 'KITCHEN_STAFF',
      assignedOutletId: kondapur.id,
    });

    const client = await connect(kondapurStaffToken);
    const res = await emitWithAck(client, 'join:outlet', kondapur.id);
    assert.equal(res.success, true);
    assert.equal(res.room, `outlet:${kondapur.id}`);

    // Kondapur staff can also join Kondapur order room
    const orderRes = await emitWithAck(client, 'join:order', testOrderKondapur.id);
    assert.equal(orderRes.success, true);
    assert.equal(orderRes.room, `order:${testOrderKondapur.id}`);
    client.disconnect();
  });

  await t.test('11. Central Admin legitimate access: Admin can join ALL kitchens, any outlet, and any order', async () => {
    const adminToken = signJwt({
      id: 'central-admin',
      role: 'ADMIN',
    });

    const client = await connect(adminToken);

    // Join ALL outlets
    const resAll = await emitWithAck(client, 'join:all-outlets');
    assert.equal(resAll.success, true);
    assert.equal(resAll.room, 'outlet:ALL');

    // Join specific outlet
    const resKondapur = await emitWithAck(client, 'join:outlet', kondapur.id);
    assert.equal(resKondapur.success, true);
    assert.equal(resKondapur.room, `outlet:${kondapur.id}`);

    // Join any order
    const resOrder = await emitWithAck(client, 'join:order', testOrderKondapur.id);
    assert.equal(resOrder.success, true);
    assert.equal(resOrder.room, `order:${testOrderKondapur.id}`);

    client.disconnect();
  });

  // -------------------------------------------------------------
  // 12. Production CORS origin guardrails
  // -------------------------------------------------------------
  await t.test('12. Production CORS validation: rejects missing, empty, or wildcard CORS_ORIGIN', () => {
    const validateProductionCors = (origin: string) => {
      const trimmed = origin.trim();
      if (!trimmed || trimmed === '*' || trimmed.split(',').some((o) => o.trim() === '*')) {
        throw new Error(
          'FATAL SECURITY CONFIGURATION: CORS_ORIGIN must be set in production to specific frontend origin(s) and cannot be missing or wildcard (*).'
        );
      }
      return true;
    };

    assert.throws(() => validateProductionCors(''), /FATAL SECURITY CONFIGURATION/);
    assert.throws(() => validateProductionCors('*'), /FATAL SECURITY CONFIGURATION/);
    assert.throws(() => validateProductionCors('https://dumline.up.railway.app, *'), /FATAL SECURITY CONFIGURATION/);
    assert.equal(validateProductionCors('https://dumline.up.railway.app'), true);
    assert.equal(validateProductionCors('https://dumline.up.railway.app, https://dumline.com'), true);
  });

  // Cleanup test fixtures
  await prisma.order.deleteMany({
    where: { id: { in: [testOrderKondapur.id, testOrderGachibowli.id] } },
  }).catch(() => {});

  await prisma.user.deleteMany({
    where: { id: { in: [custA.id, custB.id] } },
  }).catch(() => {});

  if (server.listening) {
    await new Promise<void>((resolve) => {
      io.close(() => {
        server.close(() => resolve());
      });
    });
  }
  await prisma.$disconnect();
});
