import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useTaskStories({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const alreadyPrefetched = useRef(false);
  const {
    data: items,
    isFetching,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["task-stories"],
    queryFn: () => {
      return api.getTaskStories();
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    // staleTime: 10000,
    initialData: undefined,
    placeholderData: [],
    enabled,
  });

  useEffect(() => {
    if (items) {
      if (items.length !== 0 && !alreadyPrefetched.current) {
        alreadyPrefetched.current = true;
        items.forEach((item) => {
          if (item.verificationCount > 0) {
            queryClient.prefetchInfiniteQuery({
              queryKey: ["task-stories-paginated", item.task.id],
              queryFn: () => api.getTaskStoriesPaginated(item.task.id, 1),
              getNextPageParam: (lastPage) => {
                if (lastPage.data.length < 10) {
                  return undefined;
                }
                return lastPage.page + 1;
              },
              initialPageParam: 1,
            });
          }
        });
      }
    }
  }, [items]);

  return {
    items: items || [],
    isFetching,
    isLoading,
    isRefetching: isRefetching,
    error,
    refetch,
  };
}
