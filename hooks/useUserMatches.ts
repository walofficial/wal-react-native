import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

function useUserMatches({ poolMs }: { poolMs?: number } = {}) {
  const {
    data: matches,
    isFetching,
    refetch,
    error,
    isRefetching,
  } = useQuery({
    queryKey: ["user-matches"],
    queryFn: async () => {
      const data = await api.getMatches();

      return data;
    },
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    refetchInterval: poolMs || undefined,
  });

  useEffect(() => {
    if (matches && matches.length > 0) {
      matches.forEach((match) => {
        queryClient.prefetchQuery({
          queryKey: ["user-chat", match.id],
          queryFn: () => api.getMatch(match.id),
          staleTime: 3000,
          retry: false,
        });
      });
    }
  }, [matches?.length]);

  return {
    matches: matches || [],
    isFetching: isFetching && !isRefetching,
    error,
    refetch,
  };
}

export default useUserMatches;
