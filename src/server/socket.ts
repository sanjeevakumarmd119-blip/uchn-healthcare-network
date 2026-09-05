import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToClinic(clinicId: string, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clinic:${clinicId}`).emit(event, data);
  }
}

export function emitEmergencyBroadcast(data: any) {
  if (ioInstance) {
    // Broadcast to emergency room and all connected clinics and doctors
    ioInstance.to('emergency:all').emit('emergency:new', data);
    ioInstance.emit('emergency:broadcast', data);
  }
}

export function emitAppointmentUpdate(clinicId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clinic:${clinicId}`).emit('appointment:update', data);
    ioInstance.emit('appointment:global_update', data);
  }
}

export function emitQueueUpdate(clinicId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clinic:${clinicId}`).emit('queue:update', data);
  }
}

export function emitInventoryUpdate(clinicId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`clinic:${clinicId}`).emit('inventory:update', data);
  }
}

