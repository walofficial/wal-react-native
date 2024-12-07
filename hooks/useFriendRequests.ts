import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useFriendRequests() {
  const {
    data: friendRequests,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: api.getFriendRequests,
    refetchInterval: 20000,
  });

  return {
    friendRequests,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  };
}
