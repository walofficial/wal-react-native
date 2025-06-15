import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

export function useNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up background notification handler
    const backgroundSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { type, verificationId, roomId, taskId } = response.notification.request.content.data;
        if (type === "poke") {
          queryClient.invalidateQueries({
            queryKey: ["verification-by-id", verificationId],
          });
          router.navigate({
            pathname: "/(tabs)/(home)/verification/[verificationId]",
            params: {
              verificationId,
            },
          });
          return;
        }

        if (
          type ===
          "fact_check_completed" ||
          type ===
          "video_summary_completed"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["verification-by-id", verificationId],
          });
          router.navigate({
            pathname: "/(tabs)/(global)/verification/[verificationId]",
            params: {
              verificationId,
            },
          });
          return;
        }

        if (
          type === "new_message" &&
          roomId
        ) {
          router.navigate({
            pathname: "/(tabs)/(home)/chatrooms/[roomId]",
            params: {
              roomId: response.notification.request.content.data.roomId,
            },
          });
          return;
        }
        if (taskId) {
          router.navigate({
            pathname: "/(tabs)/(home)/[taskId]",
            params: {
              taskId: taskId,
            },
          });
        }

        if (
          type ===
          "verification_like"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["verification-by-id", verificationId],
          });
          router.navigate({
            pathname: "/status/[verificationId]",
            params: {
              verificationId,
            },
          });
          return;
        }

        if (
          type === "pinned_post"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["verification-by-id", verificationId],
          });
          router.navigate({
            pathname: "/status/[verificationId]",
            params: {
              verificationId,
            },
          });
          return;
        }

        if (
          type ===
          "friend_request_sent"
        ) {
          router.navigate({
            pathname: "/(tabs)/(home)",
          });
        }
      });

    return () => {
      backgroundSubscription.remove();
    };
  }, []);
}
