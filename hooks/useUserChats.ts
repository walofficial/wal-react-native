import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import useAuth from "./useAuth";
import { getMessageChatRoomQueryKey, getUserChatRoomsOptions } from "@/lib/api/generated/@tanstack/react-query.gen";

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
    ...getUserChatRoomsOptions(),
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    refetchInterval: poolMs || undefined,
  });

  // Set individual chat rooms in the cache for quick access
  useEffect(() => {
    if (chats && chats.chat_rooms.length > 0) {
      chats.chat_rooms.forEach((chat) => {
        queryClient.setQueryData(getMessageChatRoomQueryKey({
          query: {
            room_id: chat.id,
          }
        }), chat);
      });
    }
  }, [chats, queryClient]);

  return {
    chats,
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
