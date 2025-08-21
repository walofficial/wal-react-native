import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";
import { subscribeSpaceSpaceSubscribeSpacePostMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";

export function useSubscribeToSpace() {
  const { success } = useToast()

  const { mutate: subscribeToSpace } = useMutation({
    ...subscribeSpaceSpaceSubscribeSpacePostMutation(),
    onSuccess: () => {
      success({ title: "გამოწერილია", description: "თქვენ მოგივათ შეტყობინება სტრიმის დაწყებისას" });
    },
  });

  return {
    subscribeToSpace: (roomName: string) =>
      (subscribeToSpace as any)({ body: { livekit_room_name: roomName } }),
  };
}
