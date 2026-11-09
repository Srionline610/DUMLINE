import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIOInstance(io: SocketIOServer): void {
  ioInstance = io;
}

export function getSocketIOInstance(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Safe Socket.IO event broadcaster that never throws if socket is uninitialized
 */
export const socketEvents = {
  emitOrderCreated(outletId: string, order: any): void {
    if (!ioInstance) return;
    ioInstance.to(`outlet:${outletId}`).emit('order:created', order);
    ioInstance.to(`order:${order.id}`).emit('order:created', order);
    ioInstance.to(`outlet:${outletId}`).emit('kitchen:notify', order);
    ioInstance.to(`order:${order.id}`).emit('kitchen:notify', order);
    // Broadcast to Central Admin All-Kitchens KDS channel
    ioInstance.to('outlet:ALL').emit('order:created', order);
    ioInstance.to('outlet:ALL').emit('kitchen:notify', order);
  },

  emitOrderStatusUpdated(outletId: string, order: any): void {
    if (!ioInstance) return;
    ioInstance.to(`outlet:${outletId}`).emit('order:status-updated', order);
    ioInstance.to(`order:${order.id}`).emit('order:status-updated', order);
    ioInstance.to(`outlet:${outletId}`).emit('order:update', { orderId: order.id, ...order });
    ioInstance.to(`order:${order.id}`).emit('order:update', { orderId: order.id, ...order });
    // Broadcast to Central Admin All-Kitchens KDS channel
    ioInstance.to('outlet:ALL').emit('order:status-updated', order);
    ioInstance.to('outlet:ALL').emit('order:update', { orderId: order.id, ...order });
  },

  emitPrepTimeOverridden(outletId: string, order: any): void {
    if (!ioInstance) return;
    ioInstance.to(`outlet:${outletId}`).emit('order:prep-time-overridden', order);
    ioInstance.to(`order:${order.id}`).emit('order:prep-time-overridden', order);
    ioInstance.to(`outlet:${outletId}`).emit('order:update', { orderId: order.id, ...order });
    ioInstance.to(`order:${order.id}`).emit('order:update', { orderId: order.id, ...order });
    // Broadcast to Central Admin All-Kitchens KDS channel
    ioInstance.to('outlet:ALL').emit('order:prep-time-overridden', order);
    ioInstance.to('outlet:ALL').emit('order:update', { orderId: order.id, ...order });
  },

  emitOverdueAlert(outletId: string, order: any): void {
    if (!ioInstance) return;
    ioInstance.to(`outlet:${outletId}`).emit('order:overdue-alert', order);
    ioInstance.to(`order:${order.id}`).emit('order:overdue-alert', order);
    ioInstance.to(`outlet:${outletId}`).emit('order:overdue', { orderId: order.id, ...order });
    ioInstance.to(`order:${order.id}`).emit('order:overdue', { orderId: order.id, ...order });
    // Broadcast to Central Admin All-Kitchens KDS channel
    ioInstance.to('outlet:ALL').emit('order:overdue-alert', order);
    ioInstance.to('outlet:ALL').emit('order:overdue', { orderId: order.id, ...order });
  },

  emitMenuAvailabilityUpdated(outletId: string, override: any): void {
    if (!ioInstance) return;
    ioInstance.to(`outlet:${outletId}`).emit('menu:availability-updated', override);
    ioInstance.emit('menu:availability-updated', override);
  },
};

