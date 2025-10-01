import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { getFriendRequestsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useFriendRequests() {
  const isFocused = useIsFocused();
  const {
    data: friendRequests,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  } = useQuery({
    ...getFriendRequestsOptions(),
    subscribed: isFocused,
    enabled: isFocused,
    refetchInterval: isFocused ? 30000 : false,
    refetchOnMount: false,
    gcTime: 1000 * 60 * 2,
    staleTime: 1000 * 30,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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
