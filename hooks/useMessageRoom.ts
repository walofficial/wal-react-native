import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect } from "react";

export default function useMessageRoom(
  roomId: string,
  enabled: boolean = true
) {
  const {
    data: room,
    isFetching,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ["user-chat-room", roomId],
    queryFn: () => {
      return api.getMessageRoom(roomId);
    },
    retry: false,
    enabled,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (error instanceof AxiosError) {
      // Error handling can be implemented here
    }
  }, [error, room]);
  return { room, isFetching: isFetching && !isRefetching, error };
}
