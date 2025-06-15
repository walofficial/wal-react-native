import React, { useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import useUserChats from "@/hooks/useUserChats";
import ChatItem from "../ChatItem";
import api from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function ChatRoomList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { chats, isFetching, refetch } = useUserChats({ poolMs: 5000 });
  const prefetchedChatsRef = useRef(new Set());

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["user-chat-rooms"],
    });
    refetch();
  }, [queryClient, refetch]);

  // Prefetch messages for each chat room when chat list is loaded
  useEffect(() => {
    if (chats && chats.length > 0) {
      // Prefetch the first few chat rooms' messages
      chats.slice(0, 3).forEach((chat) => {
        // Skip if already prefetched
        if (prefetchedChatsRef.current.has(chat.id)) {
          return;
        }

        const recipientId =
          chat.participants.find((p) => p.id !== user.id)?.id || "";

        // Prefetch message room data
        queryClient.prefetchQuery({
          queryKey: ["user-chat-room", chat.id],
          queryFn: () => api.getMessageRoom(chat.id),
          staleTime: 60 * 1000, // 1 minute
        });

        // Prefetch first page of messages
        queryClient.prefetchInfiniteQuery({
          queryKey: ["messages", chat.id],
          queryFn: ({ pageParam = 1 }) =>
            api.fetchMessages(pageParam, 30, chat.id, user.id),
          initialPageParam: 1,
        });

        // Mark as prefetched
        prefetchedChatsRef.current.add(chat.id);
      });
    }
  }, [chats, queryClient, user.id]);

  function renderList() {
    return chats.map((item) => <ChatItem key={item.id} item={item} />);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {isFetching ? (
          <ActivityIndicator style={styles.loader} color="white" />
        ) : (
          <>
            {renderList()}
            {!isFetching && !chats.length && <View style={{ height: 100 }} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
});
