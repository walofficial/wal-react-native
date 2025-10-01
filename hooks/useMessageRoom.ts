import { getMessageChatRoomOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';

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
    refetchOnWindowFocus: true,
    enabled: enabled && !!roomId,
    retry: true,
  });
  return { room, isFetching: isFetching && !isRefetching, error };
}
