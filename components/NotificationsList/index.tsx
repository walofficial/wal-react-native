import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
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
import { useNotificationsPaginated } from "@/hooks/useNotificationsPaginated";
import api from "@/lib/api";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import AnimatedPressable from "@/components/AnimatedPressable";

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
  return (
    <View>
      <AnimatedPressable
        onClick={onPress}
        style={[
          styles.tabButton,
          isActive ? styles.activeTabButton : styles.inactiveTabButton,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.tabText,
            isActive ? styles.activeText : styles.inactiveText,
          ]}
        >
          {text}
        </Text>
      </AnimatedPressable>
    </View>
  );
};

export default function NotificationsList() {
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  const { items, isFetching, refetch, isRefetching, isFetchingNextPage } =
    useNotificationsPaginated({
      pageSize: 10,
    });

  const likeNotifications = items.filter(
    (item) => item.notification.type === "verification_like"
  );

  // useEffect(() => {
  //   if (items.length > 0 && !hasPrefetched.current) {
  //     items
  //       .filter((item) => !!item.notification.verification_id)
  //       .slice(0, 2)
  //       .forEach((item) => {
  //         queryClient.prefetchQuery({
  //           queryKey: ["verification-by-id", item.notification.verification_id],
  //           queryFn: () =>
  //             api.getVerificationById(item.notification.verification_id),
  //           staleTime: 1000 * 60 * 5,
  //         });
  //       });
  //     hasPrefetched.current = true;
  //   }
  // }, [items]);

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
    return likeNotifications.map((item) => (
      <NotificationItem
        notificationTitle={item.from_user?.username || "[deleted]"}
        key={item.notification.id}
        item={item}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} />}
        style={styles.scrollView}
      >
        {isFetching && !isFetchingNextPage && !isRefetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
          </View>
        ) : (
          renderContent()
        )}
        {!isFetching && !items.length && <View />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButton: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  inactiveTabButton: {
    borderColor: "#404040",
  },
  iconContainer: {
    marginRight: 8,
  },
  tabText: {
    marginLeft: 0,
  },
  activeText: {
    color: "#000000",
  },
  inactiveText: {
    color: "#FFFFFF",
  },
});
