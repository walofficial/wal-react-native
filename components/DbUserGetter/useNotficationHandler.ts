import { useEffect } from "react";
import { useRouter } from "expo-router";
import { SheetManager } from "react-native-actions-sheet";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { FriendFeedItem } from "@/lib/interfaces";
import useAuth from "@/hooks/useAuth";

export function useNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Set up background notification handler
    const backgroundSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (response.notification.request.content.data?.roomId) {
          //   SheetManager.hideAll();
          router.push({
            pathname: "/(tabs)/chatrooms/chat/[roomId]",
            params: {
              roomId: response.notification.request.content.data.roomId,
            },
          });
          return;
        }
        if (response.notification.request.content.data?.taskId) {
          //   SheetManager.hide("location-user-list");
          //   SheetManager.hide("contact-sync-sheet");
          router.push({
            pathname: "/(tabs)/liveusers/feed/[taskId]",
            params: {
              taskId: response.notification.request.content.data?.taskId,
            },
          });
        }

        if (
          response.notification.request.content.data?.type ===
            "verification_like" ||
          response.notification.request.content.data?.type === "poke"
        ) {
          router.push({
            pathname: "/(tabs)/notifications",
          });
          //   SheetManager.hide("location-user-list");
          //   SheetManager.hide("contact-sync-sheet");
          return;
        }

        if (
          response.notification.request.content.data?.type === "pinned_post"
        ) {
          router.push({
            pathname:
              "/(tabs)/liveusers/feed/[taskId]/verification/[verificationId]",
            params: {
              taskId: response.notification.request.content.data.taskId,
              verificationId:
                response.notification.request.content.data.verificationId,
            },
          });
          return;
        }

        if (
          response.notification.request.content.data?.type ===
          "friend_request_sent"
        ) {
          router.replace({
            pathname: "/(tabs)/liveusers",
          });
          SheetManager.hide("location-user-list");
          queryClient.invalidateQueries({
            queryKey: ["friendRequests"],
          });
          async () => {
            const friendsFeeData = (await queryClient.getQueryData([
              "friendsFeed",
            ])) as InfiniteData<FriendFeedItem[]>;
            if (friendsFeeData && friendsFeeData.pages.length !== 0) {
              SheetManager.show("contact-sync-sheet");
            }
          };
        }
      });

    return () => {
      backgroundSubscription.remove();
    };
  }, [user]);
}
