import React, { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import useUserChats from '@/hooks/useUserChats';
import ChatItem from '../ChatItem';
import useAuth from '@/hooks/useAuth';
import { getMessageChatRoomOptions, getMessagesChatMessagesGetInfiniteOptions, getUserChatRoomsOptions, getUserChatRoomsQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { CHAT_PAGE_SIZE, decryptMessages } from '@/lib/utils';
import { ChatRoom } from '@/lib/api/generated';

export default function ChatRoomList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryOptions = getUserChatRoomsOptions();

  const { chats, isFetching, refetch } = useUserChats({ poolMs: 5000 });
  const prefetchedChatsRef = useRef(new Set());

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryOptions.queryKey,
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

        const messageOptions = getMessagesChatMessagesGetInfiniteOptions({
          query: {
            page_size: CHAT_PAGE_SIZE,
            room_id: chat.id,
          },
        });
      
        // Prefetch first page of messages
        queryClient.prefetchInfiniteQuery({
          ...messageOptions,
          queryFn: decryptMessages(user),
          initialPageParam: 1,
        });

        // Mark as prefetched
        prefetchedChatsRef.current.add(chat.id);
      });
    }
  }, [chats, queryClient, user.id]);

  function renderList() {
    return chats?.map((item) => (
      <ChatItem key={item.id} item={item as ChatRoom} />
    ));
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
            {!isFetching && !chats?.length && (
              <View style={{ height: 100 }} />
            )}
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
