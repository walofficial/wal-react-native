import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

function useUserChats({ poolMs }: { poolMs?: number } = {}) {
  const {
    data: chats,
    isFetching,
    refetch,
    error,
    isRefetching,
  } = useQuery({
    queryKey: ["user-chats"],
    queryFn: async () => {
      const data = await api.getChatRooms();

      return data;
    },
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    refetchInterval: poolMs || undefined,
  });

  useEffect(() => {
    if (chats && chats.length > 0) {
      chats.forEach((chat) => {
        queryClient.prefetchQuery({
          queryKey: ["user-chat-room", chat.id],
          queryFn: () => api.getMessageRoom(chat.id),
          staleTime: 3000,
          retry: false,
        });
      });
    }
  }, [chats?.length]);

  return {
    chats: chats || [],
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
