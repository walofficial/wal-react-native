import { useMutation } from '@tanstack/react-query';
import { removeFromStageMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useRemoveFromStage() {
  const { mutate: removeFromStage, isPending } = useMutation({
    ...removeFromStageMutation(),
  });

  return {
    isPending,
    removeFromStage: (vars: {
      livekit_room_name: string;
      participant_identity: string;
    }) => (removeFromStage as any)({ body: vars }),
  };
}
