import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stopStreamSpaceStopStreamPostMutation, getRoomPreviewDataSpacePreviewLivekitRoomNameGetQueryKey } from "@/lib/api/generated/@tanstack/react-query.gen";

export function useStopStream() {
  const queryClient = useQueryClient();
  const { mutate: stopStream, isPending } = useMutation({
    ...stopStreamSpaceStopStreamPostMutation(),
    onSuccess: (_, variable) => {
      queryClient.invalidateQueries({ queryKey: getRoomPreviewDataSpacePreviewLivekitRoomNameGetQueryKey({ path: { livekit_room_name: String(variable) } }) });
    },
  });

  return {
    isPending,
    stopStream: (roomName: string) => (stopStream as any)({ body: { livekit_room_name: roomName } }),
  };
}
