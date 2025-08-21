import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateMessageStateChatUpdateMessagesPostMutation,
  getMessagesChatMessagesGetInfiniteOptions,
} from "@/lib/api/generated/@tanstack/react-query.gen";
import { ChatMessage } from "@/lib/api/generated";

const useMessageUpdates = (
  roomId: string,
  trackedMessageIdsRef: React.MutableRefObject<Set<string>>
) => {
  const queryClient = useQueryClient();
  const mutateUpdateMessages = useMutation({
    ...updateMessageStateChatUpdateMessagesPostMutation(),
  });
  const pageSize = 15;
  const messageOptions = getMessagesChatMessagesGetInfiniteOptions({
    query: {
      page_size: pageSize,
      room_id: roomId,
    },
  });

  const sendMessageIdsToBackend = () => {
    const messageIds = Array.from(trackedMessageIdsRef.current);
    if (messageIds.length > 0) {
      (mutateUpdateMessages.mutate as any)(
        {
          body: {
            messages: messageIds.map((item) => ({ id: item, state: "READ" })),
          },
        },
        {
          onSuccess: () => {
            trackedMessageIdsRef.current.clear();
          },
        }
      );
    }
  };

  const addMessageToCache = (newMessage: ChatMessage) => {
    queryClient.setQueryData(messageOptions.queryKey, (oldData) => {
      if (!oldData) return oldData;
      const updatedPages = oldData.pages.map((page) => {
        if (page.page === 1) {
          return {
            ...page,
            messages: [...page.messages, newMessage],
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

  return { sendMessageIdsToBackend, addMessageToCache };
};

export default useMessageUpdates;
