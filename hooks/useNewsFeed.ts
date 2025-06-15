import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useIsFocused } from "@react-navigation/native";

export const useNewsFeed = (taskId: string) => {
  const isFocused = useIsFocused();
  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["news-feed", taskId],
    queryFn: async () => {
      return await api.getNewsFeed(taskId);
    },
    enabled: !!taskId,
    refetchInterval: isFocused ? 10000 : false, // 5 minutes 
    // subscribed: isFocused,
    // staleTime: 1000 * 60 * 5,
  });


  return {
    items,
    isLoading,
    isError,
    error,
    refetch,
  };
};
