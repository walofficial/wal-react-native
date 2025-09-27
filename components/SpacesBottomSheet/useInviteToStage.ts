import { useMutation } from '@tanstack/react-query';
import { inviteToStageMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useInviteToStage() {
  const { mutate: inviteToStage, isPending } = useMutation({
    ...inviteToStageMutation(),
  });

  return {
    isPending,
    inviteToStage: (vars: {
      livekit_room_name: string;
      participant_identity: string;
    }) => (inviteToStage)({ body: vars }),
  };
}
