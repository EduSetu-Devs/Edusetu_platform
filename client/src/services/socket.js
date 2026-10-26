import { io } from 'socket.io-client';
import { getStoredToken } from './authService';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:5000');

/**
 * Initialize and connect WebSocket with authenticated JWT
 */
export const connectSocket = () => {
  const token = getStoredToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  // If already connected or connecting with same token, reuse
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: `Bearer ${token}`
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('[Socket Client] Connected to EduSetu Real-Time Engine (ID:', socket.id, ')');
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket Client] Connection Error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket Client] Disconnected:', reason);
  });

  return socket;
};

/**
 * Disconnect socket cleanly on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket Client] Socket disconnected cleanly');
  }
};

/**
 * Get active socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

/**
 * Subscribe to real-time incoming messages
 * @param {Function} callback - (message) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToMessages = (callback) => {
  const s = getSocket();
  if (!s) return () => {};

  s.on('message:new', callback);
  return () => {
    s.off('message:new', callback);
  };
};

export const subscribeToSocketReconnect = (callback) => {
  const s = getSocket();
  if (!s) return () => {};

  s.on('connect', callback);
  return () => s.off('connect', callback);
};

/**
 * Subscribe to real-time notifications
 * @param {Function} callback - (notification) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToNotifications = (callback) => {
  const s = getSocket();
  if (!s) return () => {};

  s.on('notification:new', callback);
  return () => {
    s.off('notification:new', callback);
  };
};
