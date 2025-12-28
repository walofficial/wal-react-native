import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import useAuth from './useAuth';
import {
  getMessageChatRoomQueryKey,
  getUserChatRoomsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { fetchDecryptedChatRooms } from '@/lib/chat/fetchDecryptedChatRooms';

function useUserChats({ poolMs }: { poolMs?: number } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryOptions = getUserChatRoomsOptions();

  const {
    data: chats,
    isFetching,
    refetch,
    error,
    isRefetching,
  } = useQuery({
    queryKey: queryOptions.queryKey,
    queryFn: async ({ signal }) => {
      return fetchDecryptedChatRooms({ userId: user.id, signal });
    },
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
    refetchOnMount: false,
    refetchIntervalInBackground: false,
    // refetchInterval: poolMs || undefined,
  });

  // Set individual chat rooms in the cache for quick access
  useEffect(() => {
    if (chats && chats.length > 0) {
      chats.forEach((chat) => {
        queryClient.setQueryData(
          getMessageChatRoomQueryKey({
            query: {
              room_id: chat.id,
            },
          }),
          chat,
        );
      });
    }
  }, [chats, queryClient]);
  console.log(chats);
  return {
    chats: chats?.sort((a, b) => {
      const aDate = a.last_message?.sent_date
        ? new Date(a.last_message.sent_date).getTime()
        : 0;
      const bDate = b.last_message?.sent_date
        ? new Date(b.last_message.sent_date).getTime()
        : 0;
      return bDate - aDate;
    }),
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
