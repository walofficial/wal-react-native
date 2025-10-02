import { useInfiniteQuery } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { getMessagesChatMessagesGetInfiniteOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { decryptMessages } from '@/lib/utils';

const useMessageFetching = (roomId: string) => {
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
      queryFn: decryptMessages(user),
      // staleTime: Infinity,
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
