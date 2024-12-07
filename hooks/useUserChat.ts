import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { SheetManager } from "react-native-actions-sheet";

export default function useUserChat(matchId: string, enabled: boolean = true) {
  const {
    data: match,
    isFetching,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ["user-chat", matchId],
    queryFn: () => {
      return api.getMatch(matchId);
    },
    retry: false,
    enabled,
    refetchIntervalInBackground: false,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (error instanceof AxiosError) {
    }
  }, [error, match]);

  return { match, isFetching: isFetching && !isRefetching, error };
}
