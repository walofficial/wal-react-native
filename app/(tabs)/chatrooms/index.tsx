import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useLocalSearchParams } from "expo-router";
import AnimatedPressable from "@/components/AnimatedPressable";
import { cn } from "@/lib/utils";
import useUserChats from "@/hooks/useUserChats";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import ChatRoomList from "@/components/ChatRoomList";

const TabButton = ({
  isActive,
  onPress,
  text,
  badgeCount,
  badgeColor,
}: {
  isActive: boolean;
  onPress: () => void;
  text: string;
  badgeCount?: number;
  badgeColor?: string;
}) => {
  const hasBadge = useDerivedValue(() => {
    return badgeCount !== undefined && badgeCount > 0;
  }, [badgeCount]);

  const buttonWidth = useSharedValue(100); // Adjust this base width as needed

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(
        hasBadge.value ? buttonWidth.value + 50 : buttonWidth.value + 30,
        {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }
      ),
    };
  }, [hasBadge]);

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(hasBadge.value ? 1 : 0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      transform: [
        {
          scale: withTiming(hasBadge.value ? 1 : 0, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  }, [hasBadge]);

  return (
    <Animated.View style={buttonAnimatedStyle}>
      <AnimatedPressable
        onClick={onPress}
        className={cn(
          "mb-3 border border-gray-700 rounded-full p-4 flex flex-row items-center",
          isActive ? "bg-primary border-primary" : "border-gray-700"
        )}
      >
        <Text className={cn("ml-0", isActive ? "text-black" : "text-white")}>
          {text}
        </Text>
        <Animated.View style={badgeAnimatedStyle}>
          <Badge
            className={cn("bg-pink-500 ml-3 pointer-events-none", badgeColor)}
          >
            <Text className="text-white">{badgeCount}</Text>
          </Badge>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const TabSelector = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const { chats } = useUserChats();

  // useEffect(() => {
  //   queryClient.prefetchQuery({
  //     queryKey: ["my-challanges"],
  //     queryFn: () => api.getMyChallangeRequests,
  //   });
  //   SheetManager.hideAll();
  // }, []);

  return (
    <View className="flex justify-center flex-row mt-5">
      <TabButton
        isActive={activeTab === "chat"}
        onPress={() => onTabChange("chat")}
        text="მიმდინარე"
        badgeCount={chats.length}
        badgeColor="pink"
      />
    </View>
  );
};

export default function TabTwoScreen() {
  const params = useLocalSearchParams<{ tag: string }>();
  const defaultTag = params.tag || "chat";
  const [activeTab, setActiveTab] = useState(defaultTag);

  useEffect(() => {
    setActiveTab(defaultTag);
  }, [defaultTag]);

  return (
    <View className="flex-1">
      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "chat" ? <ChatRoomList /> : null}
    </View>
  );
}
