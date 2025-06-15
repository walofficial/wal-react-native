import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const ITEMS_PER_PAGE = 10;
export function useFriendsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["friendsFeed"],
    // refetchInterval: 10000,
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return pages.length + 1;
    },
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
    isFetching,
    isLoading,
  };
}
