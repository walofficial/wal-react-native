import { countLiveUsersOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

function useCountAnonList(feedId: string) {
  const isFocused = useIsFocused();
  const { data, isFetching, isRefetching, isSuccess, isError } = useQuery({
    ...countLiveUsersOptions({
      query: {
        feed_id: feedId,
      },
    }),
    refetchInterval: isFocused ? 100000 : false,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    subscribed: isFocused,
    enabled: isFocused,
    gcTime: 1000 * 60 * 2,
    staleTime: 1000 * 30,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    retryDelay: 1000,
  });
  return {
    data,
    isFetching,
    isRefetching,
    isSuccess,
    isError,
  };
}

export default useCountAnonList;
