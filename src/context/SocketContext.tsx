'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Socket connected to UCHN server');

      // Join rooms if user is authenticated
      if (user) {
        socketInstance.emit('join:user', user.userId);
        if (user.clinicId) {
          socketInstance.emit('join:clinic', user.clinicId);
        }
        if (user.role === 'DOCTOR' || user.role === 'CLINIC_ADMIN') {
          socketInstance.emit('join:emergency');
        }
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global listener for new emergency alerts
    socketInstance.on('emergency:broadcast', (data) => {
      if (user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN') {
        showToast({
          title: `🚨 EMERGENCY CASE: ${data.emergencyCase?.emergencyType || 'Critical'}`,
          message: `Case ${data.emergencyCase?.caseNumber} reported at ${data.emergencyCase?.address || 'Current Location'}. Immediate review required.`,
          type: 'emergency',
        });
      }
    });

    // In-app notifications
    socketInstance.on('notification:new', (data) => {
      showToast({
        title: data.title,
        message: data.message,
        type: data.type === 'EMERGENCY' ? 'emergency' : data.type === 'INVENTORY' ? 'warning' : 'info',
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.userId, user?.clinicId, user?.role]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        toasts,
        removeToast,
        showToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

