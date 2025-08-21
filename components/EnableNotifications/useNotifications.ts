import { registerForPushNotificationsAsync } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { expoPushTokenAtom } from "./atom";
import { upsertFcmMutation } from "@/lib/api/generated/@tanstack/react-query.gen";

export function useNotifications() {
  const setExpoPushToken = useSetAtom(expoPushTokenAtom);

  const upsertFCM = useMutation({
    ...upsertFcmMutation(),
  });

  const enableNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      upsertFCM.mutate({
        body: {
          expo_push_token: token,
        } as any,
      });
    }
  };

  return { enableNotifications };
}
