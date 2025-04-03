// src/contexts/SocketContext.tsx - Socket.IO context provider

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../store';


interface SocketContextType {
  gameSocket: Socket | null;
  userSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  gameSocket: null,
  userSocket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [userSocket, setUserSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize sockets
    const SOCKET_URL = 'http://localhost:5001';

    
    // Game namespace socket
    const gameSocketInstance = io(`${SOCKET_URL}/games`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // User namespace socket
    const userSocketInstance = io(`${SOCKET_URL}/users`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Set up event listeners
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    
    const onError = (error: any) => {
      console.error('Socket error:', error);
    };
    
    // Add event listeners
    gameSocketInstance.on('connect', onConnect);
    gameSocketInstance.on('disconnect', onDisconnect);
    gameSocketInstance.on('error', onError);
    
    userSocketInstance.on('connect', onConnect);
    userSocketInstance.on('disconnect', onDisconnect);
    userSocketInstance.on('error', onError);
    
    // Set socket instances
    setGameSocket(gameSocketInstance);
    setUserSocket(userSocketInstance);
    
    // Clean up on unmount
    return () => {
      gameSocketInstance.off('connect', onConnect);
      gameSocketInstance.off('disconnect', onDisconnect);
      gameSocketInstance.off('error', onError);
      gameSocketInstance.disconnect();
      
      userSocketInstance.off('connect', onConnect);
      userSocketInstance.off('disconnect', onDisconnect);
      userSocketInstance.off('error', onError);
      userSocketInstance.disconnect();
    };
  }, []);
  
  // Authenticate user socket when user is logged in
  useEffect(() => {
    if (userSocket && user && user.id) {
      userSocket.emit('authenticate', user.id);
      console.log('User authenticated with socket:', user.id);
    }
  }, [userSocket, user]);

  return (
    <SocketContext.Provider value={{ gameSocket, userSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
