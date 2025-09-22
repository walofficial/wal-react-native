import { getMessageChatRoom } from '@/lib/api/generated';
import { getMessageChatRoomOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect } from 'react';

export default function useMessageRoom(
  roomId: string,
  enabled: boolean = true,
) {
  const {
    data: room,
    isFetching,
    isRefetching,
    error,
  } = useQuery({
    ...getMessageChatRoomOptions({
      query: {
        room_id: roomId,
      },
    }),
    retry: false,
    enabled,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return { room, isFetching: isFetching && !isRefetching, error };
}
