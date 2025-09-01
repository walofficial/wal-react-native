import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  stopStreamMutation,
  getRoomPreviewDataQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export function useStopStream() {
  const queryClient = useQueryClient();
  const { mutate: stopStream, isPending } = useMutation({
    ...stopStreamMutation(),
    onSuccess: (_, variable) => {
      queryClient.invalidateQueries({
        queryKey: getRoomPreviewDataQueryKey({
          path: { livekit_room_name: String(variable) },
        }),
      });
    },
  });

  return {
    isPending,
    stopStream: (roomName: string) =>
      (stopStream as any)({ body: { livekit_room_name: roomName } }),
  };
}
