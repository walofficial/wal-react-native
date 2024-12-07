import { io } from "socket.io-client";
import { isDev } from "@/lib/api/config";
import ProtocolService from "@/lib/services/ProtocolService";
// "undefined" means the URL will be computed from the `window.location` object

const URL = isDev
  ? process.env.EXPO_PUBLIC_SOCKET_DEV_API_URL
  : process.env.EXPO_PUBLIC_SOCKET_API_URL;

export const getSocket = (userId: string, publicKey: string) => {
  return io(URL, {
    autoConnect: false,
    auth: {
      userId: userId,
      publicKey: publicKey,
    },
    transports: ["websocket"],
  });
};
