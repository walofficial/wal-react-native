import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEffect } from "react";
import useAuth from "./useAuth";

function useUserChats({ poolMs }: { poolMs?: number } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: chats,
    isFetching,
    refetch,
    error,
    isRefetching,
  } = useQuery({
    queryKey: ["user-chats"],
    queryFn: async () => {
      const data = await api.getChatRooms(user.id);
      return data;
    },
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    refetchInterval: poolMs || undefined,
  });

  // Set individual chat rooms in the cache for quick access
  useEffect(() => {
    if (chats && chats.length > 0) {
      chats.forEach((chat) => {
        queryClient.setQueryData(["user-chat-room", chat.id], chat);
      });
    }
  }, [chats, queryClient]);

  return {
    chats: chats || [],
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
