import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { getSocket } from "@/components/Chat/socket/socket";
import { SocketContext } from "@/components/Chat/socket/context";
import useAuth from "@/hooks/useAuth";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";

// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from "@tanstack/react-query";
import { LocationFeedPost } from "@/lib/interfaces";

export default function FeedConnectionWrapper({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket(user.id));

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onError(error) {
      console.log("error", JSON.stringify(error));
    }

    socket.on("new_feed_item", (privateMessage: LocationFeedPost) => {
      try {
        queryClient.setQueryData(
          ["location-feed-paginated", taskId],
          (data: any) => {
            return {
              ...data,
              pages: data.pages.map(
                (
                  page: {
                    data: LocationFeedPost[];
                    page: number;
                  },
                  index: number
                ) => {
                  return index === 0
                    ? {
                        ...page,
                        data: [privateMessage, ...page.data],
                      }
                    : page;
                }
              ),
            };
          }
        );
      } catch (error) {
        console.log("error", JSON.stringify(error));
      }
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("connect_error", onError);
    return () => {
      socket.off("connect", onConnect);
      socket.off("private_message");
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
