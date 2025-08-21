import { useMutation } from "@tanstack/react-query";
import { inviteToStageSpaceInviteToStagePostMutation } from "@/lib/api/generated/@tanstack/react-query.gen";

export function useInviteToStage() {
  const { mutate: inviteToStage, isPending } = useMutation({
    ...inviteToStageSpaceInviteToStagePostMutation(),
  });

  return {
    isPending,
    inviteToStage: (vars: { livekit_room_name: string; participant_identity: string }) =>
      (inviteToStage as any)({ body: vars }),
  };
}
