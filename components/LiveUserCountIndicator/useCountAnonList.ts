import api from "@/lib/api";
import { UserVerification } from "@/lib/interfaces";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

function useCountAnonList(taskId: string) {
  const isFocused = useIsFocused();
  const { data, isFetching, isRefetching, isSuccess, isError } = useQuery({
    queryKey: ["anon-list-count", taskId],
    queryFn: () => {
      return api.getAnonListCountForTask(taskId);
    },
    refetchInterval: isFocused ? 60000 : false,
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
