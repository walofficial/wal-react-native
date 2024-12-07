import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { FeedUser, User } from "@/lib/interfaces";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export function useNextFeedBatch() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  // get data from queryclient
  const existingItemData: User[] | undefined = queryClient.getQueryData([
    "user-explore",
  ]);
  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    2000
  );

  const getNextUser = useQuery({
    queryKey: ["user-explore"],
    queryFn: async () => {
      let items: User[] = [];
      // There is a case where backend might return data which current array already has.
      // This edge case is handled by setCurrentIndex call.

      if (existingItemData) {
        items = existingItemData;
      }

      const nextItems = await api.tryNextBatch();
      if (nextItems.length === 0) {
        setRefetchInterval(undefined);
      }

      nextItems.forEach((item) => {
        if (item.selected_task) {
          // queryClient.prefetchQuery({
          //   queryKey: ["categories", item.selected_task.task_category_id],
          //   queryFn: () =>
          //     api.fetchDailyTasksByCategory(
          //       item.selected_task.task_category_id
          //     ),
          // });
        }
      });

      return [...items, ...nextItems];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: [],
  });

  useEffect(() => {
    return () => {
      setCurrentIndex(0);
    };
  }, []);

  return {
    currentUsers: getNextUser.data,
    currentIndex,
    setCurrentIndex: (index: number) => {
      setCurrentIndex(index);
    },
    initialLoad,
    isFetching: getNextUser.isFetching,
    fetchUsers: () => getNextUser.refetch(),
    isUsersFetchError: getNextUser.isError,
    error: getNextUser.error,
  };
}
