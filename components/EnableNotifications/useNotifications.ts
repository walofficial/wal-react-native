import { registerForPushNotificationsAsync } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { expoPushTokenAtom } from "./atom";
import { upsertFcmMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import * as Sentry from "@sentry/react-native";
import useAuth from "@/hooks/useAuth";

export function useNotifications() {
  const { user } = useAuth();
  const setExpoPushToken = useSetAtom(expoPushTokenAtom);

  const upsertFCM = useMutation({
    ...upsertFcmMutation(),
  });

  const enableNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        upsertFCM.mutate({
          body: {
            expo_push_token: token,
          } as any,
          throwOnError: true,
        });
      }
    } catch (error) {
      console.error(error);
      Sentry.captureException(error, {
        extra: {
          user_id: user?.id,
        },
      });
    }
  };

  return { enableNotifications };
}
