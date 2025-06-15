import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useAuth from "@/hooks/useAuth";

const useMessageFetching = (
  roomId: string,
  refetchInterval: number | undefined,
  idle: boolean,
  recipientId: string
) => {
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      initialPageParam: 1,
      queryKey: ["messages", roomId],
      queryFn: ({ pageParam }: { pageParam: number | boolean }) => {
        return api.fetchMessages(pageParam, 30, roomId, user?.id);
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.nextCursor) {
          return undefined;
        }
        const sorted = allPages.sort((a, b) => b.page - a.page);
        return sorted.some((item) => item.nextCursor === null)
          ? undefined
          : sorted.find((item) => item.nextCursor && item.nextCursor)
              ?.nextCursor;
      },
      getPreviousPageParam: (firstPage) =>
        firstPage.previousCursor || undefined,
      refetchOnMount: true,
      staleTime: 1000 * 30, // Consider data fresh for 30 seconds
      gcTime: 1000 * 60 * 5, // Keep data in cache for 5 minutes
      refetchInterval: idle ? false : refetchInterval,
      refetchOnWindowFocus: !idle,
      refetchIntervalInBackground: false,
      placeholderData: {
        pages: [
          {
            data: [],
            page: 1,
            previousCursor: undefined,
            nextCursor: undefined,
          },
        ],
        pageParams: [],
      },
    });

  const firstPage = data?.pages.find((item) => item.page === 1);
  let orderedPages = data?.pages.sort((a, b) => a.page - b.page) || [];

  return {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    firstPage,
    orderedPages,
  };
};

export default useMessageFetching;
