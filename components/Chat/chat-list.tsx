import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { View, StyleSheet } from 'react-native';
import {
  KeyboardProvider,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { KeyboardAvoidingLegendList } from '@legendapp/list/keyboard';
import { User, ChatMessage } from '@/lib/api/generated';
import useAuth from '@/hooks/useAuth';
import { SocketContext } from './socket/context';
import useMessageUpdates from './useMessageUpdates';
import useMessageFetching from './useMessageFetching';
import * as Sentry from '@sentry/react-native';
import { useSetAtom } from 'jotai';
import { isChatUserOnlineState, messageAtom } from '@/lib/state/chat';
import { useGlobalSearchParams } from 'expo-router';
import SentMediaItem from '../SentMediaItem';
import useMessageRoom from '@/hooks/useMessageRoom';
import ProtocolService from '@/lib/services/ProtocolService';
import ChatTopbar from './chat-topbar';
import ChatBottombar from './chat-bottombar';
import useFeeds from '@/hooks/useFeeds';
import { useTheme } from '@/lib/theme';

interface ChatListProps {
  selectedUser: User;
}

type MessageItem = {
  _id: string;
  text: string;
  createdAt: Date;
  user: User | undefined;
};

export function ChatList({ selectedUser }: ChatListProps) {
  const trackedMessageIdsRef = useRef<Set<string>>(new Set());

  const params = useGlobalSearchParams<{
    roomId: string;
  }>();
  const { user } = useAuth();
  const socketContext = useContext(SocketContext);

  const { room } = useMessageRoom(params.roomId, false);
  const { orderedPages, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessageFetching(params.roomId);
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const setMessage = useSetAtom(messageAtom);
  const { sendMessageIdsToBackend, addMessageToCache } = useMessageUpdates(
    params.roomId,
    trackedMessageIdsRef,
  );
  const insets = useSafeAreaInsets();
  // Check user online status periodically
  useEffect(() => {
    setTimeout(() => {
      setIsChatUserOnline(false);
    }, 1000);
    const intervalId = setInterval(() => {
      socketContext?.emit('check_user_connection', {
        is_that_connected_id: selectedUser.id,
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedUser.id, socketContext]);

  // Track message reads and notify seen status
  useEffect(() => {
    orderedPages.forEach((page) => {
      page.messages.forEach((item: ChatMessage, messageIndex: number) => {
        if (item.author_id !== user.id) {
          if (page.page === 1 && messageIndex === 0) {
            socketContext?.emit('notify_single_message_seen', {
              recipient: selectedUser.id,
              temporary_id: item.temporary_id || item.id,
              author_id: item.author_id,
            });
          }
        }

        if (
          item.author_id !== user.id &&
          !trackedMessageIdsRef.current.has(item.id)
        ) {
          trackedMessageIdsRef.current.add(item.id);
        }
      });
    });
    sendMessageIdsToBackend();
  }, [orderedPages]);

  const getUserBasedOnId = useCallback(
    (id: string) => {
      return room?.participants.find((participant) => participant.id === id);
    },
    [room?.participants],
  );

  const getTimestampFromObjectId = useCallback((objectId: string) => {
    const timestampHex = objectId.substring(0, 8);
    const timestamp = parseInt(timestampHex, 16);
    const date = new Date(timestamp * 1000);
    return date;
  }, []);

  // Convert messages to flat array for LegendList
  const messageItems = useMemo(() => {
    const items: MessageItem[] = [];
    orderedPages.forEach((page) => {
      page.messages.forEach((message) => {
        items.push({
          _id:
            message.id ||
            message.temporary_id ||
            `temp-${Date.now()}-${Math.random()}`,
          // @ts-ignore
          text: message.message,
          createdAt:
            message.id && !message.temporary_id
              ? getTimestampFromObjectId(message.id)
              : new Date(),
          user: getUserBasedOnId(message.author_id),
        });
      });
    });
    return items;
  }, [orderedPages, getUserBasedOnId, getTimestampFromObjectId]);

  // Render message item
  const renderItem = useCallback(
    ({ item, index }: { item: MessageItem; index: number }) => {
      const isSender = item?.user?.id === user?.id;
      const isLastFromAuthor = index === messageItems.length - 1;

      return (
        <SentMediaItem
          id={item._id}
          content={item.text}
          isAuthor={isSender}
          createdAt={item.createdAt}
          isLastFromAuthor={isLastFromAuthor}
        />
      );
    },
    [messageItems.length, user?.id],
  );

  const keyExtractor = useCallback((item: MessageItem) => item._id, []);

  // Send message handler
  const onSendMessage = useCallback(
    async (message: string) => {
      if (message.trim().length === 0) return;
      if (message.trim()) {
        setMessage('');
        const messageToSend = message.trim();

        const randomTemporaryMessageId = Date.now().toString();
        const newMessage: Partial<ChatMessage> = {
          id: randomTemporaryMessageId,
          temporary_id: randomTemporaryMessageId,
          author_id: user.id,
          // @ts-ignore
          message: messageToSend,
          room_id: params.roomId,
          message_state: 'SENT',
          recipient_id: selectedUser.id,
          sent_date: new Date().toISOString(),
        };
        addMessageToCache(newMessage as ChatMessage);

        try {
          const { encrypted_content, nonce } =
            await ProtocolService.encryptMessage(
              selectedUser.id,
              messageToSend,
            );
          socketContext?.emit('private_message', {
            temporary_id: randomTemporaryMessageId,
            recipient: selectedUser.id,
            encrypted_content: encrypted_content,
            nonce: nonce,
            room_id: params.roomId,
          });
        } catch (error) {
          Sentry.captureException(error, {
            extra: {
              userId: user.id,
              recipientId: selectedUser.id,
            },
          });
        }
      }
    },
    [
      setMessage,
      user.id,
      params.roomId,
      selectedUser.id,
      addMessageToCache,
      socketContext,
    ],
  );

  // Load more messages when scrolling to top
  const handleStartReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <KeyboardProvider>
      {/* Message List */}
      <KeyboardAvoidingLegendList
        alignItemsAtEnd
        contentContainerStyle={styles.contentContainer}
        data={messageItems}
        estimatedItemSize={80}
        keyExtractor={keyExtractor}
        maintainScrollAtEnd={{
          onLayout: true,
          onItemLayout: true,
          onDataChange: true,
        }}
        maintainScrollAtEndThreshold={0.1}
        maintainVisibleContentPosition
        renderItem={renderItem}
        // safeAreaInsetBottom={insets.bottom}
        style={styles.list}
        onStartReached={handleStartReached}
        onStartReachedThreshold={0.5}
      />

      {/* Input Bar */}
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <ChatBottombar sendMessage={onSendMessage} />
      </KeyboardStickyView>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topbarContainer: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  list: {
    flex: 1,
  },
});
