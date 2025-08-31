import { useInfiniteQuery } from '@tanstack/react-query';
import { getVerificationsInfiniteOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';

export function useUserVerificationsPaginated({
  targetUserId,
  enabled = true,
  pageSize = LOCATION_FEED_PAGE_SIZE,
}: {
  targetUserId: string;
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
    isRefetching,
    error,
    refetch,
  } = useInfiniteQuery({
    ...getVerificationsInfiniteOptions({
      query: {
        target_user_id: targetUserId,
        page_size: pageSize,
      },
    }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return lastPage.length + 1;
    },
    enabled,
    initialPageParam: 1,
    retry: 2,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  const items = data?.pages.flatMap((page) => page) || [];
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
