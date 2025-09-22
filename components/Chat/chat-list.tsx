import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  View,
  ScrollView,
  Keyboard,
  LayoutChangeEvent,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  InteractionManager,
} from 'react-native';
import ChatBottombar from './chat-bottombar';
import { useQueryClient } from '@tanstack/react-query';
import { User, ChatMessage } from '@/lib/api/generated';
import useAuth from '@/hooks/useAuth';
import { SocketContext } from './socket/context';
import useMessageUpdates from './useMessageUpdates';
import useMessageFetching from './useMessageFetching';
import { format } from 'date-fns';
import * as Sentry from '@sentry/react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
require('dayjs/locale/ka');

interface ChatListProps {
  selectedUser: User;
  isMobile: boolean;
  canText?: boolean;
}
import { useAtomValue, useSetAtom } from 'jotai';
import { isChatUserOnlineState, messageAtom } from '@/lib/state/chat';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SentMediaItem from '../SentMediaItem';
import useMessageRoom from '@/hooks/useMessageRoom';
import ProtocolService from '@/lib/services/ProtocolService';
import { List, ListMethods } from '../List';
import { ScrollProvider } from '../List/ScrollContext';
import { isIOS, isWeb } from '@/lib/platform';
import { isNative } from '@/lib/platform';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
  useAnimatedRef,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import useFeeds from '@/hooks/useFeeds';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export function ChatList({ selectedUser, isMobile, canText }: ChatListProps) {
  const messagesContainerRef = useRef<ScrollView>(null);
  const trackedMessageIdsRef = useRef<Set<string>>(new Set());

  const params = useLocalSearchParams<{
    roomId: string;
  }>();
  const { user } = useAuth();
  const socketContext = useContext(SocketContext);
  const scrolledFirstTime = useRef(false);

  const [refetchInterval, setRefetchInterval] = useState(0);
  const { room, isFetching } = useMessageRoom(params.roomId, false);
  const {
    orderedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    firstPage,
  } = useMessageFetching(
    params.roomId,
    refetchInterval,
    false,
  );
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const setMessage = useSetAtom(messageAtom);
  const { sendMessageIdsToBackend, addMessageToCache } = useMessageUpdates(
    params.roomId,
    trackedMessageIdsRef,
  );
  const { headerHeight } = useFeeds();

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

  useEffect(() => {
    if (messagesContainerRef.current) {
      const lastMessage = firstPage?.messages[firstPage.messages.length - 1];
      if (!lastMessage) {
        return;
      }

      if (!scrolledFirstTime.current) {
        messagesContainerRef.current.scrollTo({ y: 0, animated: false });
        scrolledFirstTime.current = true;
        return;
      }

      messagesContainerRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [firstPage?.messages.length]);

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

  const getUserBasedOnId = (id: string) => {
    return room?.participants.find((participant) => participant.id === id);
  };
  function getTimestampFromObjectId(objectId: string) {
    // Extract the timestamp part of the ObjectId
    const timestampHex = objectId.substring(0, 8);
    // Convert the timestamp from hex to an integer
    const timestamp = parseInt(timestampHex, 16);
    // Convert the timestamp to milliseconds and create a Date object
    const date = new Date(timestamp * 1000);
    return date;
  }

  // Memoize the converted messages to prevent recreation on every render
  const convertedMessagesForGiftedChat = useMemo(
    () =>
      orderedPages.map((page, pageIndex) =>
        page.messages.map((message, messageIndex) => ({
          _id: message.id || message.temporary_id,
          text: message.message,
          createdAt:
            message.id && !message.temporary_id
              ? getTimestampFromObjectId(message.id)
              : new Date(),
          user: getUserBasedOnId(message.author_id),
        })),
      ) || [],
    [orderedPages],
  );

  // Memoize the messageItems array to prevent recreation on every render
  const messageItems = useMemo(
    () => [...convertedMessagesForGiftedChat.flat()],
    [convertedMessagesForGiftedChat],
  );

  // Memoize the renderItem function to prevent recreation on every render
  const messageRenderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: {
        user: User;
        text: string;
        createdAt: Date;
        _id: string;
      };
      index: number;
    }) => {
      const isSender = item?.user?.id === user?.id;

      // Check if this is the last message from this author in the visible messages
      let isLastFromAuthor = false;
      if (index === messageItems.length - 1) {
        isLastFromAuthor = true; // Last visible message
      }
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
    [messageItems, user?.id],
  );

  const flatListRef = useRef<ListMethods>(null);

  const onSendMessage = async (message: string) => {
    if (message.trim().length === 0) return;
    if (message.trim()) {
      setMessage('');
      const messageToSend = message.trim();

      // Don't use layout animation here to avoid conflict with list updates
      const randomTemporaryMessageId = Date.now().toString();
      const newMessage: Partial<ChatMessage> = {
        id: randomTemporaryMessageId,
        temporary_id: randomTemporaryMessageId,
        author_id: user.id,
        message: messageToSend,
        room_id: params.roomId,
        message_state: 'SENT',
        recipient_id: selectedUser.id,
        sent_date: new Date().toISOString(),
      };
      addMessageToCache(newMessage as ChatMessage);

      // Immediate scroll to bottom when sending a message
      InteractionManager.runAfterInteractions(() => {
        if (flatListRef.current) {
          handleScrollToEnd(true);
        }
      });

      try {
        const { encrypted_content, nonce } =
          await ProtocolService.encryptMessage(selectedUser.id, messageToSend);
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
  };

  // The bottom.
  const isAtBottom = useSharedValue(true);
  const layoutHeight = useSharedValue(0);

  // This will be used on web to assist in determining if we need to maintain the content offset
  const isAtTop = useSharedValue(true);
  const prevContentHeight = useRef(0);
  const prevItemCount = useRef(0);

  const [hasScrolled, setHasScrolled] = useState(false);
  const didBackground = useRef(false);

  // // Create a safe scroll handler function
  // const handleScrollToOffset = useCallback(
  //   (offset: number, animated: boolean) => {
  //     if (flatListRef.current) {
  //       flatListRef.current.scrollToOffset({
  //         offset,
  //         animated,
  //       });
  //     }
  //   },
  //   [],
  // );

  const handleScrollToEnd = useCallback((animated: boolean) => {
    if (flatListRef.current && messageItems.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated,
      });
    }
  }, [messageItems.length]);

  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      // For web, maintain scroll position when loading older messages
      if (isWeb && isAtTop.value && hasScrolled) {
        flatListRef.current?.scrollToOffset({
          offset: height - prevContentHeight.current,
          animated: false,
        });
      }

      // This number _must_ be the height of the MaybeLoader component (if you have one)
      if (height > 50 && isAtBottom.value) {
        // If we have background state and the content height has changed significantly
        if (
          didBackground.current &&
          hasScrolled &&
          height - prevContentHeight.current > layoutHeight.value - 50 &&
          messageItems.length - prevItemCount.current > 1
        ) {
          flatListRef.current?.scrollToOffset({
            offset: prevContentHeight.current - 65,
            animated: true,
          });
        } else if (messageItems.length > 0) {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated: hasScrolled && height > prevContentHeight.current,
          });

          // Set has scrolled after a brief delay to prevent flicker
          if (!hasScrolled && !isFetchingNextPage) {
            setTimeout(() => {
              setHasScrolled(true);
            }, 100);
          }
        }
      }

      prevContentHeight.current = height;
      prevItemCount.current = messageItems.length;
      didBackground.current = false;
    },
    [
      hasScrolled,
      setHasScrolled,
      isFetchingNextPage,
      messageItems.length,
      // these are stable
      flatListRef,
      isAtTop.value,
      isAtBottom.value,
      layoutHeight.value,
      handleScrollToEnd,
    ],
  );

  const handleScrolledDownChange = useCallback(
    (isDown: boolean) => {
      // This callback is triggered by the List component based on its internal logic
    },
    [isAtBottom],
  );

  const onScroll = useCallback(
    (e: ReanimatedScrollEvent) => {
      'worklet';
      layoutHeight.value = e.layoutMeasurement.height;
      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height;

      // Consider user at bottom if within 100px of bottom - for auto-scrolling purposes
      isAtBottom.value = e.contentSize.height - 100 < bottomOffset;
      isAtTop.value = e.contentOffset.y <= 1;

      if (!hasScrolled) {
        runOnJS(setHasScrolled)(true);
      }
    },
    [layoutHeight, isAtBottom, isAtTop, hasScrolled, setHasScrolled],
  );
  const insets = useSafeAreaInsets();
  const bottomOffset = isWeb ? 0 : 0;
  const keyboardOffsetValue = insets.bottom;

  const keyboardHeight = useSharedValue(0);
  const keyboardIsOpening = useSharedValue(false);

  const animatedListStyle = useAnimatedStyle(() => ({
    marginBottom: Math.max(
      keyboardHeight.value - keyboardOffsetValue,
      bottomOffset,
    ),
  }));

  const animatedStickyViewStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -Math.max(
          keyboardHeight.value - keyboardOffsetValue,
          bottomOffset,
        ),
      },
    ],
  }));

  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        // Immediate updates - like opening the emoji picker - will have a duration of zero. In those cases, we should
        // just update the height here instead of having the `onMove` event do it (that event will not fire!)
        if (e.duration === 0) {
          // layoutScrollWithoutAnimation.value = true;
          keyboardHeight.value = e.height;
        } else {
          keyboardIsOpening.value = true;
        }
      },
      onMove: (e) => {
        'worklet';
        keyboardHeight.value = e.height;
        // Scroll to bottom when keyboard moves if we are near the bottom
        if (e.height > bottomOffset && isAtBottom.value) {
          runOnJS(handleScrollToEnd)(false);
        }
      },
      onEnd: (e) => {
        'worklet';
        keyboardHeight.value = e.height;
        if (e.height > bottomOffset && isAtBottom.value) {
          runOnJS(handleScrollToEnd)(false);
        }
        keyboardIsOpening.value = false;
      },
    },
    [bottomOffset, handleScrollToEnd, isAtBottom.value],
  );

  const layoutScrollWithoutAnimation = useSharedValue(false);

  // -- List layout changes (opening emoji keyboard, etc.)
  const onListLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      layoutHeight.value = e.nativeEvent.layout.height;
      if ((isWeb || !keyboardIsOpening.value) && messageItems.length > 0) {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: !layoutScrollWithoutAnimation.value,
        });
        layoutScrollWithoutAnimation.value = false;
      }
    },
    [
      flatListRef,
      keyboardIsOpening.value,
      layoutScrollWithoutAnimation.value,
      layoutHeight,
      messageItems.length,
    ],
  );

  return (
    <View style={{ flex: 1, paddingTop: headerHeight }}>
      <ScrollProvider onScroll={onScroll}>
        <List
          ref={flatListRef}
          data={messageItems}
          inverted={true}
          renderItem={messageRenderItem}
          scrollEventThrottle={100}
          style={animatedListStyle}
          disableFullWindowScroll={true}
          disableVirtualization={true}
          onContentSizeChange={onContentSizeChange}
          onLayout={onListLayout}
          keyExtractor={(item) => item._id.toString()}
          initialNumToRender={isNative ? 32 : 62}
          maxToRenderPerBatch={isNative ? 32 : 62}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          onScrolledDownChange={handleScrolledDownChange}
          removeClippedSubviews={false}
          sideBorders={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              // Mark that we're fetching older messages to manage scroll
              isAtTop.value = true;
              layoutScrollWithoutAnimation.value = true;
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.2}
        />
      </ScrollProvider>
      <Animated.View style={animatedStickyViewStyle}>
        <ChatBottombar
          isMobile={isMobile}
          onFocus={() => {}}
          onBlur={() => {}}
          canText={canText}
          sendMessage={onSendMessage}
        />
      </Animated.View>
    </View>
  );
}
