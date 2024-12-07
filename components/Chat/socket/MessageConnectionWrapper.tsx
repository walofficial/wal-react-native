import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { getSocket } from "./socket";
import { SocketContext } from "./context";
import { ChatMessage } from "@/lib/interfaces";
import { useSetAtom } from "jotai";
import { isChatUserOnlineState } from "@/lib/state/chat";
import useAuth from "@/hooks/useAuth";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";

// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from "@tanstack/react-query";
import ProtocolService from "@/lib/services/ProtocolService";

export default function MessageConnectionWrapper({ children, publicKey }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { roomId } = useGlobalSearchParams();
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket(user.id, publicKey));
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsChatUserOnline(false);
    }

    function onError(error) {
      console.log("error", JSON.stringify(error));
    }

    socket?.on("user_connection_status", ({ is_connected }) => {
      if (is_connected) {
        setIsChatUserOnline(true);
      } else {
        setIsChatUserOnline(false);
      }
    });

    socket.on("user_public_key", async ({ user_id, public_key, room_id }) => {
      // Build session with remote user's pre-key bundle
      if (public_key) {
        await ProtocolService.storeRemotePublicKey(user_id, public_key);
      }
    });

    socket.on("private_message", (privateMessage: ChatMessage) => {
      const addMessageToCache = async (newMessage: {
        encrypted_content: string;
        nonce: string;
        sender: string;
        id: string;
        temporary_id: string;
      }) => {
        const decryptedMessage = await ProtocolService.decryptMessage(
          newMessage.sender,
          {
            encryptedMessage: newMessage.encrypted_content,
            nonce: newMessage.nonce,
          }
        );
        queryClient.setQueryData(["messages", roomId], (oldData: any) => {
          if (!oldData) return oldData;
          const updatedPages = oldData.pages.map((page, index) => {
            if (page.page === 1) {
              return {
                ...page,
                data: [
                  {
                    temporary_id: newMessage.temporary_id,
                    id: newMessage.id,
                    message: decryptedMessage,
                    author_id: newMessage.sender,
                  },
                  ...page.data,
                ],
              };
            }
            return page;
          });
          return {
            ...oldData,
            pages: updatedPages,
          };
        });
      };

      addMessageToCache(privateMessage);
    });

    socket.on("notify_single_message_seen", (readMessage: ChatMessage) => {
      queryClient.setQueryData(["messages", roomId], (oldData: any) => {
        if (!oldData) return oldData;

        const updatedPages = oldData.pages.map((page, index) => {
          if (page.page === 1) {
            return {
              ...page,
              data: page.data.map((item) => {
                if (item.temporary_id === readMessage.temporary_id) {
                  return {
                    ...item,
                    message_state: readMessage.message_state,
                  };
                }
                return item;
              }),
            };
          }
          return page;
        });
        return {
          ...oldData,
          pages: updatedPages,
        };
      });
    });
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    return () => {
      socket.off("connect", onConnect);
      socket.off("private_message");
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
