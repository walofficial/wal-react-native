import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';
import { useQueryClient } from '@tanstack/react-query';

import useUserChats from '@/hooks/useUserChats';
import ChatItem from '../ChatItem';
import useAuth from '@/hooks/useAuth';
import {
  getFriendRequestsQueryKey,
  getFriendsListInfiniteQueryKey,
  getFriendsListQueryKey,
  getMessageChatRoomOptions,
  getMessagesChatMessagesGetInfiniteOptions,
  getUserChatRoomsOptions,
  getUserChatRoomsQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { CHAT_PAGE_SIZE, decryptMessages } from '@/lib/utils';
import { ChatRoom } from '@/lib/api/generated';
import { t } from '@/lib/i18n';

export default function ChatRoomList({ header }: { header?: React.ReactNode }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryOptions = getUserChatRoomsOptions();
  const friendsQueryKey = getFriendsListQueryKey();
  const friendsRequests = getFriendRequestsQueryKey();
  const { chats, isFetching, refetch } = useUserChats({ poolMs: 5000 });
  const prefetchedChatsRef = useRef(new Set());
  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryOptions.queryKey,
    });
    queryClient.invalidateQueries({
      queryKey: friendsQueryKey,
    });
    queryClient.invalidateQueries({
      queryKey: friendsRequests,
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
        {isFetching ? null : (
          <>
            {header}
            {renderList()}
            {!isFetching && !chats?.length && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={56}
                  color={theme.colors.feedItem.secondaryText}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  {t('common.no_chats_yet')}
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: theme.colors.feedItem.secondaryText },
                  ]}
                >
                  {t('common.add_friends_from_stories')}
                </Text>
              </View>
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
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
