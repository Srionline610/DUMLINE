import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In browser, connect to backend server
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Socket.IO disconnected:', reason);
    });
  }

  return socket;
}

export function subscribeToOutlet(outletId: string): void {
  const s = getSocket();
  const emitJoin = () => {
    if (outletId === 'ALL') {
      s.emit('join:all-outlets');
    } else {
      s.emit('join:outlet', outletId);
    }
  };

  if (s.connected) {
    emitJoin();
  } else {
    s.once('connect', emitJoin);
  }
}

export function subscribeToOrder(orderId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('join:order', orderId);
  } else {
    s.once('connect', () => {
      s.emit('join:order', orderId);
    });
  }
}

