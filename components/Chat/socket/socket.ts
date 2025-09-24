import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api/config';
// "undefined" means the URL will be computed from the `window.location` object

export const getSocket = (userId: string, publicKey: string, deviceId: string) => {
  return io(API_BASE_URL, {
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
};
