import * as http from 'http';
import * as path from 'path';
import * as cp from 'child_process';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config';
import prisma from './prisma/client';
import { setSocketIOInstance } from './utils/socket';

import { verifyJwt, decodeJwtUnverified } from './utils/crypto';

const server = http.createServer(app);

// Production-ready Socket.IO CORS configuration
const socketCorsOrigin = config.corsOrigin || '*';
const allowedSocketOrigins = socketCorsOrigin.includes(',')
  ? socketCorsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : socketCorsOrigin === '*'
  ? '*'
  : socketCorsOrigin;

// Initialize Socket.IO directly with Express server
export const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigins,
    methods: ['GET', 'POST'],
    credentials: allowedSocketOrigins !== '*',
  },
});

setSocketIOInstance(io);

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (typeof socket.handshake.headers.authorization === 'string' &&
    socket.handshake.headers.authorization.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.substring(7)
      : null) ||
    socket.handshake.query?.token;

  if (typeof token === 'string' && token.trim()) {
    const payload = verifyJwt(token.trim());
    if (payload) {
      socket.data.user = payload;
      return next();
    }
    const unverified = decodeJwtUnverified(token.trim());
    const now = Math.floor(Date.now() / 1000);
    if (unverified?.exp && unverified.exp < now) {
      return next(new Error('AUTH_EXPIRED_TOKEN'));
    }
    return next(new Error('AUTH_INVALID_TOKEN'));
  }

  // Reject unauthenticated connections in production OR when strict auth is enabled
  if (config.nodeEnv === 'production' || process.env.REQUIRE_SOCKET_AUTH === 'true') {
    return next(new Error('AUTH_REQUIRED'));
  }

  next();
});

io.on('connection', (socket) => {
  socket.on('join:outlet', (outletId: string, callback?: (res: any) => void) => {
    const user = socket.data.user;
    if (!user) {
      const err = { code: 'AUTH_REQUIRED', message: 'Authentication required to join kitchen outlet room' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
      return;
    }

    // Role check: Only ADMIN, KITCHEN_STAFF, and OUTLET_MANAGER are permitted in kitchen outlet rooms!
    const allowedKitchenRoles = ['ADMIN', 'KITCHEN_STAFF', 'OUTLET_MANAGER'];
    if (!allowedKitchenRoles.includes(user.role)) {
      const err = { code: 'FORBIDDEN_ROLE', message: `Role '${user.role}' is not authorized to join kitchen outlet rooms` };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
      return;
    }

    if (outletId === 'ALL') {
      if (user.role === 'ADMIN') {
        socket.join('outlet:ALL');
        if (typeof callback === 'function') callback({ success: true, room: 'outlet:ALL' });
      } else {
        const err = { code: 'FORBIDDEN', message: 'Central Admin role required to monitor all kitchens' };
        socket.emit('error', err);
        if (typeof callback === 'function') callback({ success: false, error: err });
      }
      return;
    }

    // Staff and Outlet Managers must have assignedOutletId and must match outletId
    if (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER') {
      if (!user.assignedOutletId || !user.assignedOutletId.trim()) {
        const err = { code: 'MISSING_ASSIGNED_OUTLET', message: 'Staff or manager has no assigned outlet ID' };
        socket.emit('error', err);
        if (typeof callback === 'function') callback({ success: false, error: err });
        return;
      }
      if (user.assignedOutletId !== outletId) {
        const err = { code: 'CROSS_OUTLET_FORBIDDEN', message: 'Staff is isolated to assigned outlet queue only' };
        socket.emit('error', err);
        if (typeof callback === 'function') callback({ success: false, error: err });
        return;
      }
    }

    // Admin can join any specific outlet; assigned staff/manager joins their outlet
    socket.join(`outlet:${outletId}`);
    if (typeof callback === 'function') callback({ success: true, room: `outlet:${outletId}` });
  });

  socket.on('join:all-outlets', (callback?: (res: any) => void) => {
    const user = socket.data.user;
    if (!user || user.role !== 'ADMIN') {
      const err = { code: 'FORBIDDEN', message: 'Central Admin role required to monitor all kitchens' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
      return;
    }
    socket.join('outlet:ALL');
    if (typeof callback === 'function') callback({ success: true, room: 'outlet:ALL' });
  });

  socket.on('join:order', async (orderId: string, callback?: (res: any) => void) => {
    const user = socket.data.user;
    if (!user) {
      const err = { code: 'AUTH_REQUIRED', message: 'Authentication required to join order room' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
      return;
    }

    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      const err = { code: 'INVALID_ORDER_ID', message: 'Valid orderId is required' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
      return;
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId.trim() },
        select: { id: true, customerId: true, outletId: true },
      });

      if (!order) {
        const err = { code: 'ORDER_NOT_FOUND', message: `Order '${orderId}' not found` };
        socket.emit('error', err);
        if (typeof callback === 'function') callback({ success: false, error: err });
        return;
      }

      // Authorization checks:
      let isAuthorized = false;

      if (user.role === 'ADMIN') {
        isAuthorized = true;
      } else if (user.role === 'CUSTOMER') {
        if (order.customerId === user.id) {
          isAuthorized = true;
        }
      } else if (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER') {
        if (user.assignedOutletId && user.assignedOutletId === order.outletId) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        const err = { code: 'ORDER_FORBIDDEN', message: 'Unauthorized to access this order room' };
        socket.emit('error', err);
        if (typeof callback === 'function') callback({ success: false, error: err });
        return;
      }

      socket.join(`order:${order.id}`);
      if (typeof callback === 'function') callback({ success: true, room: `order:${order.id}` });
    } catch (e: any) {
      const err = { code: 'SERVER_ERROR', message: e.message || 'Failed to authorize order room' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback({ success: false, error: err });
    }
  });
});

async function bootstrapDatabase() {
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected successfully (${userCount} users present).`);
    if (userCount === 0) {
      console.log('⚡ Database connected but empty. Seeding initial data...');
      const serverRoot = path.resolve(__dirname, '..');
      cp.execSync('npx ts-node --transpile-only src/prisma/seed.ts', { stdio: 'inherit', cwd: serverRoot });
      console.log('✅ Initial database seed completed.');
    }
  } catch (err: any) {
    if (
      err.message?.includes("Table") &&
      (err.message?.includes("doesn't exist") || err.message?.includes("not found") || err.code === 'ER_NO_SUCH_TABLE')
    ) {
      console.log('⚠️ Database tables missing. Running initial Prisma migration deploy...');
      const serverRoot = path.resolve(__dirname, '..');
      cp.execSync('npx prisma migrate deploy --config src/prisma/prisma.config.ts', { stdio: 'inherit', cwd: serverRoot });
      console.log('✅ Migrations applied. Running initial seed...');
      cp.execSync('npx ts-node --transpile-only src/prisma/seed.ts', { stdio: 'inherit', cwd: serverRoot });
      console.log('✅ Database fully bootstrapped and seeded.');
    } else {
      const detailedCause = err.cause ? (err.cause.message || err.cause) : '';
      console.error('⚠️ Database connection verification notice:', err.message, detailedCause ? `(Cause: ${detailedCause})` : '');
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, config.host, () => {
    console.log(`🏰 Dumline API server running on ${config.host}:${config.port} (${config.nodeEnv})`);
    console.log(`🔌 Socket.IO endpoint ready`);
    bootstrapDatabase().catch((e) => console.error('Database bootstrap error:', e.message));
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database pool...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { server };

