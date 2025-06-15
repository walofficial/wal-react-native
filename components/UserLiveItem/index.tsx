import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/interfaces";
import { Skeleton } from "../ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import UserAvatarLayout, { AvatarWidth } from "../UserAvatar";
import ImageLoader from "../ImageLoader";
import { convertToCDNUrl } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

export default function UserLiveItem({
  size = "md",
  user,
  isLoading,
  isSuccess,
  color = "green",
  showName = false,
  showClose = false,
}: {
  user: User;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isSuccess?: boolean;
  color?: "green" | "pink" | "blue" | "gray";
  showName?: boolean;
  showClose?: boolean;
}) {
  const theme = useTheme();
  const imageUrl =
    user.photos && user.photos.length > 0
      ? user.photos[0].image_url[0]
      : undefined;

  return (
    <View style={styles.container}>
      <UserAvatarLayout size={size} borderColor={color}>
        <Animated.View
          style={[
            {
              backgroundColor: !imageUrl
                ? theme.colors.card.background
                : "transparent",
            },
            styles.imageContainer,
            !imageUrl && styles.roundedFull,
          ]}
        >
          {imageUrl ? (
            <ImageLoader
              style={{
                borderRadius: 100,
                width: "100%",
                height: "100%",
              }}
              source={{
                uri: convertToCDNUrl(imageUrl),
              }}
            />
          ) : (
            <Text
              style={[styles.placeholderText, { color: theme.colors.text }]}
            >
              {user?.username || "N/A"}
            </Text>
          )}
        </Animated.View>
      </UserAvatarLayout>
      {showName && (
        <View style={styles.nameContainer}>
          <Text
            numberOfLines={1}
            style={[styles.username, { color: theme.colors.text }]}
          >
            {user.username}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  roundedFull: {
    borderRadius: 9999,
  },
  placeholderText: {
    fontSize: 24,
  },
  iconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  nameContainer: {
    width: "100%",
    textAlign: "center",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 14,
  },
});

export const UserLiveItemSkeleton = ({
  size = "md",
}: {
  size: "sm" | "md" | "lg";
}) => {
  return (
    <UserAvatarLayout size={size} borderColor={"gray"}>
      <Skeleton style={styles.roundedFull} />
    </UserAvatarLayout>
  );
};
