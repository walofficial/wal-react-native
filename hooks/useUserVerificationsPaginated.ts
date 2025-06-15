import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserVerification } from "@/lib/interfaces";
import { useIsFocused } from "@react-navigation/native";

export function useUserVerificationsPaginated({
  targetUserId,
  enabled = true,
  pageSize = 10,
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
    queryKey: ["user-verifications-paginated", targetUserId],
    queryFn: ({ pageParam = 1 }) =>
      api.getUserVerifications(targetUserId, pageParam, pageSize),
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
