import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useIsFocused } from "@react-navigation/native";

export function useMyChallangeRequests() {
  const isFocused = useIsFocused();
  const {
    data: challangeRequests,
    isFetching,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["my-challanges"],
    queryFn: api.getMyChallangeRequests,
    placeholderData: [],
    refetchInterval: () => (isFocused ? 3000 : false),
  });

  return {
    challangeRequests,
    isFetching,
    isRefetching,
    refetch,
  };
}
