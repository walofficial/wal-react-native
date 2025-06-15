import React, { useCallback } from "react";
import { View, TouchableHighlight, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useAuth from "@/hooks/useAuth";
import { Text } from "../ui/text";
import { ChatRoom } from "@/lib/interfaces";
import { CheckCircle2 } from "lucide-react-native";
import { FontSizes } from "@/lib/theme";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useTheme } from "@/lib/theme";

function ChatItem({ item }: { item: ChatRoom }) {
  const { user: authorizedUser } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const targetUser = item.participants.find(
    (user) => user.id !== authorizedUser.id
  );

  const isNavigationEnabled = !!targetUser?.username;

  // Prefetch chat data when user interacts with chat item
  const prefetchChatData = useCallback(() => {
    if (!isNavigationEnabled) return;

    // Prefetch message room data
    queryClient.prefetchQuery({
      queryKey: ["user-chat-room", item.id],
      queryFn: () => api.getMessageRoom(item.id),
      staleTime: 60 * 1000, // 1 minute
    });

    // Prefetch first page of messages for this chat
    queryClient.prefetchInfiniteQuery({
      queryKey: ["messages", item.id],
      queryFn: ({ pageParam = 1 }) =>
        api.fetchMessages(pageParam, 30, item.id, authorizedUser.id),
      initialPageParam: 1,
    });
  }, [item.id, isNavigationEnabled, queryClient, authorizedUser.id]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffSeconds = Math.floor(
      (now.getTime() - messageDate.getTime()) / 1000
    );

    if (diffSeconds < 10) {
      return "Now";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours > 0) {
        return `${diffHours}h`;
      }
      if (diffMinutes > 0) {
        return `${diffMinutes}m`;
      }
      return "Now";
    }

    if (diffDays < 7) {
      return messageDate.toLocaleDateString("en-US", { weekday: "short" });
    }
    return messageDate.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
  };

  const renderMessageStatus = () => {
    if (item.last_message?.message_state === "SENT") {
      if (item.last_message.author_id !== authorizedUser.id) {
        return null;
      }
      return (
        <CheckCircle2
          color={theme.colors.feedItem.secondaryText}
          size={16}
          style={styles.messageStatusIcon}
        />
      );
    }
    if (item.last_message?.message_state === "READ") {
      return (
        <CheckCircle2
          fill={theme.colors.primary}
          stroke={theme.colors.background}
          size={16}
          style={styles.messageStatusIcon}
        />
      );
    }
    return null;
  };

  return (
    <Link
      href={{
        pathname: "/chatrooms/[roomId]",
        params: { roomId: item.id },
      }}
      asChild
    >
      <TouchableHighlight
        underlayColor={theme.colors.card.background}
        onPress={prefetchChatData}
        disabled={!isNavigationEnabled}
        style={[
          styles.container,
          !isNavigationEnabled && styles.disabledContainer,
        ]}
      >
        <View
          style={[
            styles.mainContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.rowContainer}>
            <View style={styles.avatarContainer}>
              <Avatar alt="Avatar" style={styles.avatar}>
                <AvatarImage
                  source={{ uri: targetUser?.photos[0].image_url[0] }}
                />
                <AvatarFallback>
                  <Text>{targetUser?.username?.[0] || "[d]"}</Text>
                </AvatarFallback>
              </Avatar>
            </View>

            <View style={styles.messageContainer}>
              <View style={styles.headerContainer}>
                <Text style={[styles.username, { color: theme.colors.text }]}>
                  {targetUser?.username || "[deleted]"}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: theme.colors.feedItem.secondaryText },
                  ]}
                >
                  {formatDate(new Date(item.last_message?.sent_date))}
                </Text>
              </View>
              <View style={styles.messageContent}>
                <Text
                  style={[
                    styles.messageText,
                    { color: theme.colors.feedItem.secondaryText },
                  ]}
                  numberOfLines={1}
                >
                  {item.last_message?.message}
                </Text>
                <View style={styles.statusContainer}>
                  {renderMessageStatus()}
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 8,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  mainContent: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    paddingTop: 6,
    paddingBottom: 12,
    paddingLeft: 12,
  },
  avatar: {
    width: 60,
    height: 60,
  },
  messageContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    paddingTop: 8,
    paddingRight: 12,
    justifyContent: "space-between",
  },
  username: {
    fontSize: 20,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 14,
    marginTop: 8,
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 40,
  },
  messageText: {
    fontSize: FontSizes.medium,
    flex: 1,
    marginRight: 48,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
    paddingTop: 12,
  },
  messageStatusIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    opacity: 0.8,
  },
});

export default ChatItem;
