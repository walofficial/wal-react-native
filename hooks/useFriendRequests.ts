import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useIsFocused } from "@react-navigation/native";

export function useFriendRequests() {
  const isFocused = useIsFocused()
  const {
    data: friendRequests,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: api.getFriendRequests,
    subscribed: isFocused,
    enabled: isFocused,
    refetchInterval: isFocused ? 30000 : false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 1000 * 60 * 2,
    staleTime: 1000 * 30,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 1000,
  });

  return {
    friendRequests,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  };
}
