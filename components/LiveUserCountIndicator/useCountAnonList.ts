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
    enabled: !!isFocused,
    retry: 2,
    refetchInterval: 20000,
    refetchOnWindowFocus: false,
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
