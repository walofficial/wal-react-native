import React, { useRef } from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import {
  MenuView as RNMenuView,
  MenuComponentRef,
} from "@react-native-menu/menu";
import { Ionicons } from "@expo/vector-icons";
import useAuth from "@/hooks/useAuth";
import useReportTask from "@/hooks/useReportTask";
import useBlockUser from "@/hooks/useBlockUser";
import useDeleteFriendMutation from "@/hooks/useDeleteFriendMutation";
import { useMakePublicMutation } from "@/hooks/useMakePublicMutation";
import usePinVerification from "@/hooks/usePinVerification";
import useUnpinVerification from "@/hooks/useUnpinVerification";
import { shareUrl } from "@/lib/share";
import { app_name_slug } from "@/app.config";
import { useTheme } from "@/lib/theme";

interface MenuViewProps {
  verificationId: string;
  friendId: string;
  isStory?: boolean;
  isPublic?: boolean;
  canPin?: boolean;
  isPinned?: boolean;
  taskId?: string;
}

function MenuView({
  verificationId,
  friendId,
  isPublic,
  canPin,
  isPinned,
  taskId,
}: MenuViewProps) {
  const menuRef = useRef<MenuComponentRef>(null);
  const { user } = useAuth();
  const reportTask = useReportTask();
  const blockUser = useBlockUser();
  const pinFeedItem = usePinVerification();
  const removePinnedFeedItem = useUnpinVerification();
  const deleteFriendMutation = useDeleteFriendMutation();
  const makePublicMutation = useMakePublicMutation(verificationId);
  const theme = useTheme();

  const isAuthor = friendId === user?.id;

  const handleDeleteFriend = () => {
    deleteFriendMutation.mutate(friendId);
  };

  const handleBlockUser = () => {
    blockUser.mutate(friendId);
  };

  const handleMakePublic = (isPublic: boolean) => {
    makePublicMutation.mutate(isPublic);
  };

  const handleReport = () => {
    reportTask.mutate(verificationId);
  };

  const handlePin = () => {
    if (taskId) {
      pinFeedItem.mutate({ taskId, verificationId });
    }
  };

  const handleUnpin = () => {
    if (taskId) {
      removePinnedFeedItem.mutate({ taskId, verificationId });
    }
  };

  const handleShare = async () => {
    try {
      await shareUrl(`https://${app_name_slug}.ge/status/${verificationId}`);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <RNMenuView
      ref={menuRef}
      title="რა გსურთ?"
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === "report") {
          handleReport();
        } else if (nativeEvent.event === "remove") {
          handleDeleteFriend();
        } else if (nativeEvent.event === "block") {
          handleBlockUser();
        } else if (nativeEvent.event === "hide-post") {
          handleMakePublic(false);
        } else if (nativeEvent.event === "show-post") {
          handleMakePublic(true);
        } else if (nativeEvent.event === "share") {
          handleShare();
        } else if (nativeEvent.event === "pin") {
          handlePin();
        } else if (nativeEvent.event === "unpin") {
          handleUnpin();
        }
      }}
      shouldOpenOnLongPress={false}
      actions={
        isAuthor
          ? [
              {
                id: "share",
                title: "გაზიარება",
                imageColor: "#46F289",
              },
              ...(canPin
                ? [
                    {
                      id: isPinned ? "unpin" : "pin",
                      title: isPinned ? "დაპინვის წაშლა" : "დაპინვა",
                    },
                  ]
                : []),
              ...(isPublic
                ? [
                    {
                      id: "hide-post",
                      title: "დამალვა",
                    },
                  ]
                : [
                    {
                      id: "show-post",
                      title: "გამოჩენა",
                    },
                  ]),
            ]
          : [
              {
                id: "share",
                title: "გაზიარება",
                imageColor: "#46F289",
              },
              {
                id: "block",
                title: "დაბლოკვა",
                attributes: {
                  destructive: true,
                },
              },
              {
                id: "report",
                title: "დაარეპორტე",
                attributes: {
                  destructive: true,
                },
              },
            ]
      }
    >
      <Pressable
        hitSlop={10}
        style={styles.pressable}
        onPress={() => {
          if (Platform.OS === "android") {
            menuRef.current?.show();
          }
        }}
      >
        <Ionicons
          style={styles.icon}
          name="ellipsis-horizontal"
          size={18}
          color={theme.colors.feedItem.secondaryText}
        />
      </Pressable>
    </RNMenuView>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginRight: 5,
  },
  icon: {},
});

export default MenuView;
