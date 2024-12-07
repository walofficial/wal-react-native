import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { Heart } from "lucide-react-native";

import NotificationItem from "@/components/NotificationItem";
import UserMatchesNotFound from "@/components/UserMatchesNotFound";
import { useNotificationsPaginated } from "@/hooks/useNotificationsPaginated";
import api from "@/lib/api";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import AnimatedPressable from "@/components/AnimatedPressable";
import { cn } from "@/lib/utils";

const TabButton = ({
  isActive,
  onPress,
  text,
  badgeCount,
  badgeColor,
  icon,
}: {
  isActive: boolean;
  onPress: () => void;
  text: string;
  badgeCount?: number;
  badgeColor?: string;
  icon?: React.ReactNode;
}) => {
  const hasBadge = useDerivedValue(() => {
    return badgeCount !== undefined && badgeCount > 0;
  }, [badgeCount]);

  const buttonWidth = useSharedValue(100);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(
        hasBadge.value ? buttonWidth.value : buttonWidth.value,
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
    <View>
      <AnimatedPressable
        onClick={onPress}
        className={cn(
          "mb-3 border border-gray-700 rounded-full py-2 px-4 flex flex-row items-center",
          isActive ? "bg-primary border-primary" : "border-gray-700"
        )}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={cn("ml-0", isActive ? "text-black" : "text-white")}>
          {text}
        </Text>
      </AnimatedPressable>
    </View>
  );
};

export default function NotificationsList() {
  const queryClient = useQueryClient();

  const { items, isFetching, refetch, isFetchingNextPage } =
    useNotificationsPaginated({
      pageSize: 10,
    });

  const pokeNotifications = items.filter(
    (item) => item.notification.type === "poke"
  );
  const likeNotifications = items.filter(
    (item) => item.notification.type === "verification_like"
  );
  const impressionNotifications = items.filter(
    (item) => item.notification.type === "impression"
  );

  // Find first tab with data
  const firstTabWithData =
    pokeNotifications.length > 0
      ? "pokes"
      : likeNotifications.length > 0
      ? "likes"
      : impressionNotifications.length > 0
      ? "impressions"
      : "pokes";

  useEffect(() => {
    setActiveTab(firstTabWithData);
  }, [firstTabWithData]);

  const availableTabs = [
    pokeNotifications.length > 0 && "pokes",
    likeNotifications.length > 0 && "likes",
    impressionNotifications.length > 0 && "impressions",
  ].filter(Boolean) as string[];

  const [activeTab, setActiveTab] = useState(firstTabWithData);

  useEffect(() => {
    if (items.length > 0) {
      items
        .filter((item) => !!item.notification.verification_id)
        .slice(0, 2)
        .forEach((item) => {
          queryClient.prefetchQuery({
            queryKey: ["verification-by-id", item.notification.verification_id],
            queryFn: () =>
              api.getVerificationById(item.notification.verification_id),
            staleTime: 1000 * 60 * 5,
          });
        });
    }
  }, [items]);

  const { mutate: markNotificationsAsRead } = useMutation({
    mutationFn: api.markNotificationsAsRead,
    onSuccess: () => {
      queryClient.setQueryData(["unread-notifications-count"], 0);
    },
  });

  useEffect(() => {
    markNotificationsAsRead();
    return () => {};
  }, []);

  const renderContent = () => {
    if (activeTab === "pokes") {
      return pokeNotifications.map((item) => (
        <NotificationItem key={item.notification.id} item={item} />
      ));
    } else if (activeTab === "likes") {
      return likeNotifications.map((item) => (
        <NotificationItem key={item.notification.id} item={item} />
      ));
    } else {
      return impressionNotifications.map((item) => (
        <NotificationItem key={item.notification.id} item={item} />
      ));
    }
  };

  return (
    <View className="flex-1">
      {availableTabs.length > 0 && (
        <View className="flex justify-center flex-row mt-5">
          {pokeNotifications.length > 0 && (
            <>
              <TabButton
                isActive={activeTab === "pokes"}
                onPress={() => setActiveTab("pokes")}
                text="ჯიკები"
                badgeCount={pokeNotifications.length}
                badgeColor="bg-pink-500"
              />
              {(likeNotifications.length > 0 ||
                impressionNotifications.length > 0) && <View className="w-3" />}
            </>
          )}

          {likeNotifications.length > 0 && (
            <>
              <TabButton
                isActive={activeTab === "likes"}
                onPress={() => setActiveTab("likes")}
                text="მოწონებები"
                badgeCount={likeNotifications.length}
                badgeColor="bg-blue-500"
                icon={
                  <Heart
                    size={16}
                    color={activeTab === "likes" ? "black" : "white"}
                  />
                }
              />
              {impressionNotifications.length > 0 && <View className="w-3" />}
            </>
          )}

          {impressionNotifications.length > 0 && (
            <TabButton
              isActive={activeTab === "impressions"}
              onPress={() => setActiveTab("impressions")}
              text="ნახვები"
              badgeCount={impressionNotifications.length}
              badgeColor="bg-gray-500"
            />
          )}
        </View>
      )}

      <ScrollView className="px-3 pt-2">
        {isFetching && !isFetchingNextPage ? (
          <View className="flex-1 py-5 justify-center items-center">
            <ActivityIndicator color="white" />
          </View>
        ) : (
          renderContent()
        )}
        {!isFetching && !items.length && <UserMatchesNotFound />}
      </ScrollView>
    </View>
  );
}
