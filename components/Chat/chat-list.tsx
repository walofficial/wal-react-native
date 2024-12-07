import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  FlatList,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import ChatBottombar from "./chat-bottombar";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage, User } from "@/lib/interfaces";
import useAuth from "@/hooks/useAuth";
import { SocketContext } from "./socket/context";
import useMessageUpdates from "./useMessageUpdates";
import useMessageFetching from "./useMessageFetching";
import { format } from "date-fns";
require("dayjs/locale/ka");

interface ChatListProps {
  selectedUser: User;
  isMobile: boolean;
  canText?: boolean;
}
import { useSetAtom } from "jotai";
import { isChatUserOnlineState, messageAtom } from "@/lib/state/chat";
import useUserChat from "@/hooks/useUserChat";
import { useLocalSearchParams } from "expo-router";
import { cn } from "@/lib/utils";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import ChatInitialActions from "../ChatInitialActions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SentMediaItem from "../ChatInitialActions/sent-media-item";
import { Large } from "../ui/typography";
import useMessageRoom from "@/hooks/useMessageRoom";
import ProtocolService from "@/lib/services/ProtocolService";
import { Ionicons } from "@expo/vector-icons";
import { LockIcon } from "lucide-react-native";

export function ChatList({ selectedUser, isMobile, canText }: ChatListProps) {
  const messagesContainerRef = useRef<ScrollView>(null);
  const trackedMessageIdsRef = useRef<Set<string>>(new Set());

  const params = useLocalSearchParams<{
    roomId: string;
  }>();
  const { user } = useAuth();
  const socketContext = useContext(SocketContext);
  const scrolledFirstTime = useRef(false);

  const queryClient = useQueryClient();
  const [refetchInterval, setRefetchInterval] = useState(0);
  const { room, isFetching } = useMessageRoom(params.roomId, false);
  const insets = useSafeAreaInsets();
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
    selectedUser.id
  );
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const setMessage = useSetAtom(messageAtom);
  const { sendMessageIdsToBackend, addMessageToCache } = useMessageUpdates(
    params.roomId,
    queryClient,
    trackedMessageIdsRef
  );

  useEffect(() => {
    setTimeout(() => {
      setIsChatUserOnline(false);
    }, 1000);
    const intervalId = setInterval(() => {
      socketContext?.emit("check_user_connection", {
        is_that_connected_id: selectedUser.id,
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedUser.id, socketContext]);
  useEffect(() => {
    if (messagesContainerRef.current) {
      const lastMessage = firstPage?.data[firstPage.data.length - 1];
      if (!lastMessage) {
        return;
      }

      if (!scrolledFirstTime.current) {
        messagesContainerRef.current.scrollToEnd({ animated: false });
        scrolledFirstTime.current = true;
        return;
      }

      messagesContainerRef.current.scrollToEnd({ animated: true });
    }
  }, [firstPage?.data.length]);

  useEffect(() => {
    orderedPages.forEach((page) => {
      page.data.forEach((item: ChatMessage, messageIndex: number) => {
        if (item.author_id !== user.id) {
          if (page.page === 1 && messageIndex === 0) {
            socketContext?.emit("notify_single_message_seen", {
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

  // const userHasVerified =
  //   match?.task_completer_user_ids?.includes(user.id) || false;
  // const matchUserHasVerified = match?.task_completer_user_ids.includes(
  //   match.target_user.id
  // );

  // const showChatInitialActions = !userHasVerified || !matchUserHasVerified;

  const getUserBasedOnId = (id: string) => {
    return room?.participants.find((participant) => participant.id === id);
  };
  function getTimestampFromObjectId(objectId) {
    // Extract the timestamp part of the ObjectId
    const timestampHex = objectId.substring(0, 8);
    // Convert the timestamp from hex to an integer
    const timestamp = parseInt(timestampHex, 16);
    // Convert the timestamp to milliseconds and create a Date object
    const date = new Date(timestamp * 1000);
    return date;
  }

  const convertedMessagesForGiftedChat =
    orderedPages.map((page, pageIndex) =>
      page.data.map((message, messageIndex) => ({
        _id: message.id || message.temporary_id,
        text: message.message,
        createdAt:
          message.id && !message.temporary_id
            ? getTimestampFromObjectId(message.id)
            : new Date(),
        user: getUserBasedOnId(message.author_id),
      }))
    ) || [];

  const flatListRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("");
  const [isDateVisible, setIsDateVisible] = useState(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      scrollToStart
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      scrollToStart
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const messageRenderItem = ({
    item,
  }: {
    item: {
      user: User;
      text: string;
    };
  }) => {
    const isSender = item.user.id === user.id;
    return (
      <SentMediaItem
        selectedUser={selectedUser}
        currentUser={user}
        content={item.text}
        isAuthor={isSender}
      />
    );
  };

  const onSendMessage = async (message: string) => {
    if (message.trim().length === 0) return;
    if (message.trim()) {
      setMessage("");
      const messageToSend = message.trim();

      const randomTemporaryMessageId = Date.now().toString();
      const newMessage: ChatMessage = {
        id: randomTemporaryMessageId,
        temporary_id: randomTemporaryMessageId,
        author_id: user.id,
        message: messageToSend,
        room_id: params.roomId,
        message_state: "SENT",
      };
      addMessageToCache(newMessage);
      try {
        const { encrypted_content, nonce } =
          await ProtocolService.encryptMessage(selectedUser.id, messageToSend);

        // // Update the temporary message with decrypted content
        // const updatedMessage = {
        //   ...newMessage,
        //   message: decryptedMessage
        // };
        // addMessageToCache(updatedMessage);
        console.log("sending message", encrypted_content, nonce);
        socketContext?.emit("private_message", {
          temporary_id: randomTemporaryMessageId,
          recipient: selectedUser.id,
          encrypted_content: encrypted_content,
          nonce: nonce,
          user_id: user.id,
          room_id: params.roomId,
        });
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const scrollToStart = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsDateVisible(true);
  };

  const handleScrollEnd = () => {
    scrollTimeoutRef.current = setTimeout(() => {
      setIsDateVisible(false);
    }, 1000);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const firstVisibleItem = viewableItems[0].item;
      const formattedDate = format(
        new Date(firstVisibleItem.createdAt),
        "MMM d, yyyy"
      );
      setCurrentDate(formattedDate);
    }
  }).current;

  const BackgroundView = View;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: insets.top + 80 }}
      behavior="padding"
    >
      {/* {showChatInitialActions && <ChatInitialActions />} */}
      <FlatList
        ref={flatListRef}
        data={[...convertedMessagesForGiftedChat.flat()]}
        renderItem={messageRenderItem}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        // onContentSizeChange={scrollToStart}
        keyExtractor={(_, index) => index?.toString()}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        ListFooterComponent={
          <View className="h-20 items-center justify-center">
            <Text className="text-gray-500 text-center text-md">
              ავტომურად წაიშლება აპლიკაციის დახურვისას
            </Text>
            <View className="justify-center flex flex-row w-full items-center mt-2">
              <LockIcon size={16} color="#22c55e" />
              <Text className="text-sm mt-1 flex-row gap-4 ml-2">
                E2E encrypted
              </Text>
            </View>
          </View>
        }
        inverted
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.1}
      />
      <ChatBottombar
        isMobile={isMobile}
        onFocus={() => {}}
        onBlur={() => {}}
        canText={canText}
        sendMessage={onSendMessage}
      />
    </KeyboardAvoidingView>
  );
}
