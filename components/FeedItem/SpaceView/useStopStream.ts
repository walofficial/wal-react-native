import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useStopStream() {
  const queryClient = useQueryClient();
  const { mutate: stopStream, isPending } = useMutation({
    mutationFn: (livekit_room_name: string) =>
      api.stopStream(livekit_room_name),
    onSuccess: (_, variable) => {
      queryClient.invalidateQueries({ queryKey: ["room-preview", variable] });
    },
  });

  return {
    isPending,
    stopStream,
  };
}
