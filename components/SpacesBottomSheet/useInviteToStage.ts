import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export function useInviteToStage() {
  const { mutate: inviteToStage, isPending } = useMutation({
    mutationFn: ({
      livekit_room_name,
      participant_identity,
    }: {
      livekit_room_name: string;
      participant_identity: string;
    }) => api.inviteToStage(livekit_room_name, participant_identity),
  });

  return {
    isPending,
    inviteToStage,
  };
}
