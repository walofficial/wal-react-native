import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { InfiniteData } from "@tanstack/react-query";
import { ChatMessage, ChatMessages } from "@/lib/interfaces";
import useAuth from "@/hooks/useAuth";

const useMessageUpdates = (
  roomId: string,
  queryClient: any,
  trackedMessageIdsRef: React.MutableRefObject<Set<string>>
) => {
  const mutateUpdateMessages = useMutation({
    mutationKey: ["update-messages"],
    mutationFn: (messages) => api.updateMessages(messages),
  });

  const sendMessageIdsToBackend = () => {
    const messageIds = Array.from(trackedMessageIdsRef.current);
    if (messageIds.length > 0) {
      mutateUpdateMessages.mutate(
        messageIds.map((item) => ({ id: item, state: "READ" })),
        {
          onSuccess: () => {
            trackedMessageIdsRef.current.clear();
          },
        }
      );
    }
  };

  const addMessageToCache = (newMessage: ChatMessage) => {
    queryClient.setQueryData(
      ["messages", roomId],
      (
        oldData: InfiniteData<{
          data: ChatMessages;
          page: number;
          previousCursor?: number | undefined;
          nextCursor?: number | undefined;
        }>
      ) => {
        if (!oldData) return oldData;
        const updatedPages = oldData.pages.map((page) => {
          if (page.page === 1) {
            return {
              ...page,
              data: [newMessage, ...page.data],
            };
          }
          return page;
        });
        return {
          ...oldData,
          pages: updatedPages,
        };
      }
    );
  };

  return { sendMessageIdsToBackend, addMessageToCache };
};

export default useMessageUpdates;
