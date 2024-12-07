import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Link, usePathname } from "expo-router";
import { H1 } from "../ui/typography";
import { TabBarIcon } from "../navigation/TabBarIcon";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from "react-native-reanimated";
import { statusBadgeTextState } from "@/lib/state/custom-status";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import UnreadCount from "../UnreadCount";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useScrollReanimatedValue } from "../context/ScrollReanimatedValue";
import { HEADER_HEIGHT } from "@/lib/constants";

export default function ProfileHeader({
  customTitleComponent,
  customBottomView,
  isAnimated = true,
  customButtons,
}: {
  customTitleComponent?: React.ReactNode;
  customBottomView?: React.ReactNode;
  isAnimated?: boolean;
  customButtons?: React.ReactNode;
}) {
  const badgeWidth = useSharedValue(0);
  const iconTranslateX = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { unreadCount } = useUnreadCount();
  const { headerTranslateY, headerOpacity } = useScrollReanimatedValue();
  const setHeaderHeight = useSetAtom(HEADER_HEIGHT);

  // useEffect(() => {
  //   console.log("scrollY", scrollY.value);
  // }, [scrollY.value]);

  useEffect(() => {
    if (unreadCount > 0) {
      badgeWidth.value = withSpring(30);
      iconTranslateX.value = withSpring(-10);
    } else {
      badgeWidth.value = withSpring(0);
      iconTranslateX.value = withSpring(0);
    }
  }, [unreadCount]);

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: badgeWidth.value + 10,
      opacity: badgeWidth.value === 0 ? 0 : 1,
      overflow: "hidden",
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: iconTranslateX.value }],
    };
  });
  const headerStyles = useAnimatedStyle(() => {
    if (!isAnimated) return {};

    return {
      transform: [{ translateY: headerTranslateY.value }],
      marginBottom: 20,
      opacity: headerOpacity.value,
    };
  });

  return (
    <Animated.View style={headerStyles}>
      <LinearGradient
        colors={[
          "rgba(0,0,0,1)",
          "rgba(0,0,0,0.98)",
          "rgba(0,0,0,0.87)",
          "rgba(0,0,0,0.70)",
          !isAnimated ? "transparent" : "rgba(0,0,0,0.70)",
          !isAnimated ? "transparent" : "rgba(0,0,0,0.70)",
          !isAnimated ? "transparent" : "rgba(0,0,0,0.70)",
        ]}
      >
        <View
          onLayout={(event) => {
            setHeaderHeight(event.nativeEvent.layout.height);
          }}
          className={`flex flex-row pr-5 pl-2 items-center w-full justify-between`}
          style={{
            paddingTop: insets.top,
            borderBottomWidth: 1,
            borderBottomColor: isAnimated
              ? "rgba(255,255,255,0.1)"
              : "transparent",
          }}
        >
          <Link href="/(tabs)/liveusers/feed" asChild>
            {customTitleComponent || <H1 className="p-4 pl-3">{"MNT"}</H1>}
          </Link>
          <View className="flex-row items-center gap-4">
            {customButtons}
            {!customButtons && (
              <Link href={"/(tabs)/chatrooms"} asChild>
                <TouchableOpacity className="flex flex-row items-center">
                  <Animated.View style={iconAnimatedStyle}>
                    <TabBarIcon color="white" name="paper-plane-outline" />
                  </Animated.View>
                </TouchableOpacity>
              </Link>
            )}
            {!customButtons && (
              <Link href={"/(tabs)/notifications"} asChild>
                <TouchableOpacity className="flex flex-row items-center">
                  <Animated.View style={iconAnimatedStyle}>
                    <TabBarIcon color="white" name="notifications-outline" />
                  </Animated.View>
                  {unreadCount > 0 && (
                    <Badge className="bg-pink-600 pointer-events-none">
                      <UnreadCount />
                    </Badge>
                  )}
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </View>
        {customBottomView}
      </LinearGradient>
    </Animated.View>
  );
}

export function AnimatedStatusBadge() {
  const [statusText, setStatusText] = useAtom(statusBadgeTextState);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    if (statusText) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });

      const timer = setTimeout(() => {
        translateY.value = withTiming(-50, {
          duration: 300,
          easing: Easing.in(Easing.exp),
        });
        setTimeout(() => setStatusText(""), 300); // Set text to empty after animation completes
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-50, {
        duration: 300,
        easing: Easing.in(Easing.exp),
      });
    }
  }, [statusText]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      marginRight: 10,
      transform: [{ translateY: translateY.value }],
      opacity: translateY.value === -50 ? 0 : 1, // Hide when fully up
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Badge className="mr-2 bg-pink-700 pointer-events-none">
        <Text className="text-lg text-white">{statusText}</Text>
      </Badge>
    </Animated.View>
  );
}
