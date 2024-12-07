import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import cn from "clsx";
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
  const imageUrl =
    user.photos && user.photos.length > 0
      ? user.photos[0].image_url[0]
      : undefined;

  const [progress, setProgress] = useState(0);
  const progressOpacity = useSharedValue(1);
  const checkmarkOpacity = useSharedValue(0);
  const imageOpacity = useSharedValue(1);

  useEffect(() => {
    if (!isSuccess) {
      setProgress(0);
      progressOpacity.value = withTiming(0, { duration: 300 });
      checkmarkOpacity.value = withTiming(0, { duration: 300 });
      imageOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isSuccess]);

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progressOpacity.value,
    };
  });

  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkOpacity.value,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
    };
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      progressOpacity.value = withTiming(1, { duration: 300 });
      checkmarkOpacity.value = withTiming(0, { duration: 300 });
      imageOpacity.value = withTiming(1, { duration: 300 });
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 1) {
            clearInterval(interval);
            return 1;
          }
          return prevProgress + 0.33;
        });
      }, 50);
    } else if (isSuccess) {
      progressOpacity.value = withTiming(0, { duration: 300 });
      checkmarkOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
      imageOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      setProgress(0);
      progressOpacity.value = withTiming(0, { duration: 300 });
      checkmarkOpacity.value = withTiming(0, { duration: 300 });
      imageOpacity.value = withTiming(1, { duration: 300 });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, isSuccess]);

  return (
    <View className="relative flex-1 items-center justify-center">
      <UserAvatarLayout size={size} borderColor={color}>
        <Animated.View
          style={[
            {
              backgroundColor: !imageUrl ? "#36454F" : "transparent",
            },
            imageAnimatedStyle,
          ]}
          className={cn("flex items-center justify-center w-full h-full", {
            "rounded-full": !imageUrl,
          })}
        >
          {imageUrl ? (
            <ImageLoader
              style={{
                borderRadius: 100,
              }}
              className="rounded-full"
              source={{ uri: imageUrl }}
            />
          ) : (
            <Text className="text-white text-2xl">
              {user?.username || "N/A"}
            </Text>
          )}
        </Animated.View>
        {!showClose && (
          <Animated.View
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              checkmarkAnimatedStyle,
            ]}
            className="flex items-center justify-center"
          >
            <Ionicons name="megaphone" size={20} color="white" />
          </Animated.View>
        )}
        {showClose && (
          <Animated.View
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              {
                opacity: 1,
              },
            ]}
            className="flex items-center justify-center"
          >
            <Ionicons name="close" size={35} color="white" />
          </Animated.View>
        )}
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            progressAnimatedStyle,
          ]}
          className="flex items-center justify-center"
        >
          <Progress.Pie
            color="rgba(0,0,0,0.5)"
            progress={progress}
            size={AvatarWidth - 10}
          />
        </Animated.View>
      </UserAvatarLayout>
      {showName && (
        <View className="w-full text-center flex-1 items-center justify-center">
          <Text numberOfLines={1} className="text-white text-sm">
            {user.username}
          </Text>
        </View>
      )}
    </View>
  );
}

export const UserLiveItemSkeleton = ({
  size = "md",
}: {
  size: "sm" | "md" | "lg";
}) => {
  return (
    <UserAvatarLayout size={size} borderColor={"gray"}>
      <Skeleton className="w-full h-full rounded-full" />
    </UserAvatarLayout>
  );
};
