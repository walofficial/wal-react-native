import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import useAuth from './useAuth';
import {
  getMessageChatRoomQueryKey,
  getUserChatRoomsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { getUserChatRooms } from '@/lib/api/generated';
import ProtocolService from '@/lib/services/ProtocolService';

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
    queryFn: async ({ queryKey, signal }) => {
      const { data } = await getUserChatRooms({
        signal,
        throwOnError: true,
      });
      
      return await Promise.all(data.chat_rooms.map(async (chat) => {
        const lastMessage = chat.last_message;
        if (!lastMessage) {
          return chat;
        }
        const decryptedMessage = await ProtocolService.decryptMessage(user.id === lastMessage?.author_id
          ? lastMessage.recipient_id
          : lastMessage.author_id,   
          {
            encryptedMessage: lastMessage.encrypted_content || '',
            nonce: lastMessage.nonce || '',
          });
        return {
          ...chat,
          last_message: {
            ...lastMessage,
            message: decryptedMessage,
          },
        };
      }));
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

  return {
    chats,
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
