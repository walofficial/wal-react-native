import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useNotificationsPaginated({
  enabled = true,
  pageSize = 10,
}: {
  enabled?: boolean;
  pageSize?: number;
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error,
    refetch,
    hasPreviousPage,
  } = useInfiniteQuery({
    queryKey: ["notifications-paginated"],
    queryFn: ({ pageParam = 1 }) =>
      api.getNotificationsPaginated({ page: pageParam, pageSize }),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    enabled,
    initialPageParam: 1,
    refetchInterval: 10000,
    retry: 2,
  });

  const items = data?.pages.flatMap((page) => page.data) || [];

  return {
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error,
    refetch,
  };
}
