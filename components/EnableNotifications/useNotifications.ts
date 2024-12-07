import api from "@/lib/api";
import { registerForPushNotificationsAsync } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { expoPushTokenAtom } from "./atom";

export function useNotifications() {
  const queryClient = useQueryClient();
  const setExpoPushToken = useSetAtom(expoPushTokenAtom);

  const upsertFCM = useMutation({
    mutationKey: ["fcm-save"],
    mutationFn: (token: string | null) => api.upsertFCMData(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fcm-get"] });
    },
  });

  const enableNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      upsertFCM.mutate(token);
    }
  };

  return { enableNotifications };
}
