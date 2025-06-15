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
import Sentry from "@sentry/react-native";
// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from "@tanstack/react-query";
import ProtocolService from "@/lib/services/ProtocolService";
import { toast } from "@backpackapp-io/react-native-toast";
import { useIsFocused } from "@react-navigation/native";

export default function MessageConnectionWrapper({ children, publicKey }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { roomId } = useGlobalSearchParams();
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket(user.id, publicKey));
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      socketRef.current.connect();
    } else {
      socketRef.current.disconnect();
    }
  }, [isFocused]);

  useEffect(() => {
    const socket = socketRef.current;
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

    const handleConnectionStatus = ({
      is_connected,
    }: {
      is_connected: boolean;
    }) => {
      if (is_connected) {
        setIsChatUserOnline(true);
      } else {
        setIsChatUserOnline(false);
      }
    };

    const handlePublicKey = async ({
      user_id,
      public_key,
      room_id,
    }: {
      user_id: string;
      public_key: string;
      room_id: string;
    }) => {
      if (public_key) {
        await ProtocolService.storeRemotePublicKey(user_id, public_key);
      }
    };

    const handleMessageSeen = (readMessage: ChatMessage) => {
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
    };

    // Define the message handler separately so we can reference it in cleanup
    const handlePrivateMessage = (privateMessage: ChatMessage) => {
      const addIncomingMessage = async (newMessage: {
        encrypted_content: string;
        nonce: string;
        sender: string;
        id: string;
        temporary_id: string;
      }) => {
        let decryptedMessage = "";
        try {
          decryptedMessage = await ProtocolService.decryptMessage(
            newMessage.sender,
            {
              encryptedMessage: newMessage.encrypted_content,
              nonce: newMessage.nonce,
            }
          );
        } catch (error) {
          console.log("error", error);
          Sentry.captureException(error, {
            extra: {
              userId: user?.id,
              senderId: newMessage.sender,
            },
          });
        }
        if (!decryptedMessage) {
          return;
        }
        queryClient.setQueryData(["messages", roomId], (oldData: any) => {
          if (!oldData) return oldData;

          const updatedPages = oldData.pages.map((page, index) => {
            if (page.page === 1) {
              return {
                ...page,
                data: [
                  ...page.data,
                  {
                    temporary_id: newMessage.temporary_id,
                    id: newMessage.id,
                    message: decryptedMessage,
                    author_id: newMessage.sender,
                  },
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

      addIncomingMessage(privateMessage);
    };

    socket.on("user_connection_status", handleConnectionStatus);
    socket.on("user_public_key", handlePublicKey);
    socket.on("private_message", handlePrivateMessage);
    socket.on("notify_single_message_seen", handleMessageSeen);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("private_message", handlePrivateMessage);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("user_connection_status", handleConnectionStatus);
      socket.off("user_public_key", handlePublicKey);
      socket.off("notify_single_message_seen", handleMessageSeen);
    };
  }, [queryClient, roomId]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
