import { useInfiniteQuery } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import {
  getMessagesChatMessagesGetInfiniteOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { getMessagesChatMessagesGet } from '@/lib/api/generated';
import { ChatMessage, GetMessagesResponse } from '@/lib/api/generated';
import ProtocolService from '@/lib/services/ProtocolService';

type ChatMessages = ChatMessage[];

const useMessageFetching = (
  roomId: string,
) => {
  const { user } = useAuth();
  const pageSize = 15;
  const queryOptions = getMessagesChatMessagesGetInfiniteOptions({
    query: {
      page_size: pageSize,
      room_id: roomId,
    },
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...queryOptions,
      queryFn: async ({ pageParam, queryKey, signal }) => {
        const one = queryKey[0];

        const { data } = await getMessagesChatMessagesGet({
          query: {
            page_size: one.query.page_size,
            room_id: one.query.room_id,
            page: pageParam as number,
          },
          signal,
          throwOnError: true,
        });

        // Decrypt messages
        const localUserId = user?.id;

        if (!localUserId) {
          return data;
        }

        let decryptedMessages: ChatMessages = [];
        try {
          const processedMessages = await Promise.all(
            data.messages.map(async (message: ChatMessage) => {
              try {
                if (message.encrypted_content && message.nonce) {
                  let decryptedMessage = '';

                  decryptedMessage = await ProtocolService.decryptMessage(
                    localUserId === message.author_id
                      ? message.recipient_id
                      : message.author_id,
                    {
                      encryptedMessage: message.encrypted_content,
                      nonce: message.nonce,
                    },
                  );

                  return {
                    ...message,
                    message: decryptedMessage,
                  };
                }
                return message;
              } catch (decryptError) {
                console.error(
                  `Failed to decrypt message ${message.id}:`,
                  decryptError
                );
                return null; // Return null for failed messages
              }
            }),
          );

          // Filter out null values from failed decryption attempts
          decryptedMessages = processedMessages.filter(
            (msg): msg is ChatMessage => msg !== null,
          );
        } catch (error) {
          console.error('Error processing messages', error);
          decryptedMessages = data.messages
            .map((message: ChatMessage) => {
              if (message.encrypted_content) {
                return null;
              }
              return message;
            })
            .filter((msg): msg is ChatMessage => msg !== null);
        }

        // Return the same structure as GetMessagesResponse but with decrypted messages
        const response: GetMessagesResponse = {
          ...data,
          messages: decryptedMessages,
        };

        return response;
      },
      staleTime: Infinity,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.next_cursor) {
          return undefined;
        }
        const sorted = allPages.sort((a, b) => b.page - a.page);
        // Use the number of pages already loaded to compute the next page number
        // Starts at 1, so next page after N pages is N + 1
        return sorted.some((item) => item.next_cursor === null)
          ? undefined
          : sorted.find((item) => !!item.next_cursor)?.next_cursor;
      },
      getPreviousPageParam: (firstPage) =>
        firstPage.previous_cursor || undefined,
      refetchOnMount: true,
      // staleTime: 1000 * 5, // Consider data fresh for 30 seconds
      // gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      placeholderData: {
        pages: [
          {
            messages: [],
            page: 1,
            page_size: pageSize,
          },
        ],
        pageParams: [],
      },
    });
  let orderedPages = data?.pages.sort((a, b) => b.page - a.page) || [];

  return {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    orderedPages,
  };
};

export default useMessageFetching;
