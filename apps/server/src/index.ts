import * as http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config';
import prisma from './prisma/client';
import { setSocketIOInstance } from './utils/socket';

const server = http.createServer(app);

// Initialize Socket.IO directly with Express server for Phase 4 foundation / Phase 6 real-time
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setSocketIOInstance(io);

io.on('connection', (socket) => {
  socket.on('join:outlet', (outletId: string) => {
    if (outletId === 'ALL') {
      socket.join('outlet:ALL');
    } else {
      socket.join(`outlet:${outletId}`);
    }
  });

  socket.on('join:all-outlets', () => {
    socket.join('outlet:ALL');
  });

  socket.on('join:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
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

