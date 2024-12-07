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
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error instanceof AxiosError) {
    }
  }, [error, room]);

  return { room, isFetching: isFetching && !isRefetching, error };
}
