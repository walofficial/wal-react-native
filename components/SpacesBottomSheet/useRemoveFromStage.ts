import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export function useRemoveFromStage() {
  const { mutate: removeFromStage, isPending } = useMutation({
    mutationFn: ({
      livekit_room_name,
      participant_identity,
    }: {
      livekit_room_name: string;
      participant_identity: string;
    }) => api.removeFromStage(livekit_room_name, participant_identity),
  });

  return {
    isPending,
    removeFromStage,
  };
}
