import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinEventRoom: (eventId: string) => void;
  joinTeamRoom: (teamId: string) => void;
  joinAdminRoom: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to backend server:', socketInstance.id);
      setIsConnected(true);

      if (user?.role === 'ADMIN') {
        socketInstance.emit('join:admin');
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.role]);

  const joinEventRoom = (eventId: string) => {
    if (socket && eventId) {
      socket.emit('join:event', eventId);
    }
  };

  const joinTeamRoom = (teamId: string) => {
    if (socket && teamId) {
      socket.emit('join:team', teamId);
    }
  };

  const joinAdminRoom = () => {
    if (socket) {
      socket.emit('join:admin');
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinEventRoom, joinTeamRoom, joinAdminRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
