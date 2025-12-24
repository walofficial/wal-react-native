import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api/config';
// "undefined" means the URL will be computed from the `window.location` object

const HEARTBEAT_INTERVAL_MS = 25_000;

export const getSocket = (
  userId: string,
  publicKey: string,
  deviceId: string,
) => {
  const socket = io(API_BASE_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: {
      userId: userId,
      publicKey: publicKey,
      deviceId: deviceId,
    },
    transports: ['websocket'],
  });

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const clearHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const startHeartbeat = () => {
    clearHeartbeat();
    // Send one immediately, then periodically refresh presence on the server.
    socket.emit('heartbeat');
    heartbeatInterval = setInterval(() => {
      if (socket.connected) socket.emit('heartbeat');
    }, HEARTBEAT_INTERVAL_MS);
  };

  socket.on('connect', startHeartbeat);
  socket.on('disconnect', clearHeartbeat);
  socket.on('connect_error', clearHeartbeat);

  return socket;
};
