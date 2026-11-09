import * as http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config';
import prisma from './prisma/client';
import { setSocketIOInstance } from './utils/socket';

import { verifyJwt } from './utils/crypto';

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
    }
  }
  next();
});

io.on('connection', (socket) => {
  socket.on('join:outlet', (outletId: string) => {
    const user = socket.data.user;
    if (outletId === 'ALL') {
      if (user && user.role === 'ADMIN') {
        socket.join('outlet:ALL');
      } else {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Central Admin role required to monitor all kitchens' });
      }
      return;
    }

    if (user && (user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER')) {
      if (user.assignedOutletId && user.assignedOutletId !== outletId) {
        socket.emit('error', {
          code: 'CROSS_OUTLET_FORBIDDEN',
          message: 'Staff is isolated to assigned outlet queue only',
        });
        return;
      }
    }
    socket.join(`outlet:${outletId}`);
  });

  socket.on('join:all-outlets', () => {
    const user = socket.data.user;
    if (user && user.role === 'ADMIN') {
      socket.join('outlet:ALL');
    } else {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Central Admin role required to monitor all kitchens' });
    }
  });

  socket.on('join:order', (orderId: string) => {
    if (typeof orderId === 'string' && orderId.trim()) {
      socket.join(`order:${orderId.trim()}`);
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`🏰 Dumline API server running on port ${config.port} (${config.nodeEnv})`);
    console.log(`🔌 Socket.IO endpoint ready`);
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

