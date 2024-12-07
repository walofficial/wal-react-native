import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useLocationFeedPaginated({
  enabled = true,
  taskId,
  pageSize = 10,
}: {
  enabled?: boolean;
  taskId: string;
  pageSize?: number;
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isRefetching,
    error,
    refetch,
    hasPreviousPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["location-feed-paginated", taskId],
    queryFn: ({ pageParam = 1 }) =>
      api.getLocationFeedPaginated(taskId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    enabled,
    initialPageParam: 1,
    retry: 2,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
  const items = data?.pages.flatMap((page) => page.data) || [];

  return {
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isRefetching,
    error,
    isPending,
    refetch,
  };
}
