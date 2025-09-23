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

      return await Promise.all(
        data.chat_rooms.map(async (chat) => {
          const lastMessage = chat.last_message;
          if (!lastMessage) {
            return chat;
          }
          let decryptedMessage = "";
          try {
           decryptedMessage = await ProtocolService.decryptMessage(
            user.id === lastMessage?.author_id
              ? lastMessage.recipient_id
              : lastMessage.author_id,
            {
              encryptedMessage: lastMessage.encrypted_content || '',
              nonce: lastMessage.nonce || '',
            },
          );
        } catch (error) {
          console.log(error);
          decryptedMessage = ''
        }
          return {
            ...chat,
            last_message: {
              ...lastMessage,
              message: decryptedMessage,
            },
          };
        }),
      );
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
    chats: chats?.sort((a, b) => {
      const aDate = a.last_message?.sent_date ? new Date(a.last_message.sent_date).getTime() : 0;
      const bDate = b.last_message?.sent_date ? new Date(b.last_message.sent_date).getTime() : 0;
      return bDate - aDate;
    }),
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserChats;
