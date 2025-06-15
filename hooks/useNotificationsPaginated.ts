import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useIsFocused } from "@react-navigation/native";

export function useNotificationsPaginated({
  enabled = true,
  pageSize = 10,
}: {
  enabled?: boolean;
  pageSize?: number;
}) {
  const isFocused = useIsFocused();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error,
    isRefetching,
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
    enabled: enabled && isFocused,
    initialPageParam: 1,
    // MEMORY LEAK FIX: Remove constant polling, only refetch when focused and active
    refetchInterval: isFocused ? 30000 : false, // Reduced from 10s to 30s and only when focused
    retry: 1, // Reduced retries
    // Memory leak prevention settings
    gcTime: 1000 * 60 * 2, // 2 minutes - more aggressive garbage collection
    staleTime: 1000 * 30, // 30 seconds - data stays fresh for 30s
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    subscribed: isFocused,
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
    refetch,
  };
}
