import React, { useState, useEffect, useRef, useContext } from "react";
import { getSocket } from "@/components/Chat/socket/socket";
import { SocketContext } from "@/components/Chat/socket/context";
import useAuth from "@/hooks/useAuth";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";

// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from "@tanstack/react-query";
import { publicKeyState } from "@/lib/state/auth";
import { useAtomValue } from "jotai";

export default function FeedConnectionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { feedId, content_type } = useLocalSearchParams<{
    feedId: string;
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();
  const queryClient = useQueryClient();
  const publicKey = useAtomValue(publicKeyState);

  const socketRef = useRef(getSocket(user.id, publicKey));

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
