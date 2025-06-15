import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@backpackapp-io/react-native-toast";

export function useSubscribeToSpace() {
  const { mutate: subscribeToSpace } = useMutation({
    mutationFn: (roomName: string) => api.subscribeToSpace(roomName),
    onSuccess: () => {
      toast.success("თქვენ მოგივათ შეტყობინება სტრიმის დაწყებისას");
    },
  });

  return {
    subscribeToSpace,
  };
}
