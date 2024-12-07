import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserVerification } from "@/lib/interfaces";

export function useUserVerificationsPaginated({
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
    isRefetching,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["user-verifications-paginated"],
    queryFn: ({ pageParam = 1 }) =>
      api.getUserVerifications(pageParam, pageSize),
    getNextPageParam: (lastPage, pages) => {
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
    refetch,
  };
}
