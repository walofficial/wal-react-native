import { useMutation, useQuery } from '@tanstack/react-query';
import { subscribeSpaceMutation } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useToast } from '@/components/ToastUsage';

export function useSubscribeToSpace() {
  const { success } = useToast();

  const { mutate: subscribeToSpace } = useMutation({
    ...subscribeSpaceMutation(),
    onSuccess: () => {
      success({
        title: 'გამოწერილია',
        description: 'თქვენ მოგივათ შეტყობინება სტრიმის დაწყებისას',
      });
    },
  });

  return {
    subscribeToSpace: (roomName: string) =>
      (subscribeToSpace as any)({ body: { livekit_room_name: roomName } }),
  };
}
