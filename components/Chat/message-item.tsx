import React from "react";
import { ChatMessage, User } from "@/lib/interfaces";
import MessageItemLayout from "./message-item-layout";
import MessageItemText from "./message-item-text";
import MessageItemStatusMark from "./message-item-status-mark";
import MessageItemAvatar from "./message-item-avatar";
import { View } from "react-native";

interface MessageItemProps {
  item: ChatMessage;
  selectedUser: User;
  currentUser: User;
  messageIndex: number;
  pageIndex: number;
  page: { page: number };
}

const MessageItem: React.FC<MessageItemProps> = ({
  item,
  selectedUser,
  currentUser,
  messageIndex,
  page,
}) => {
  const isAuthor = item.author_id === currentUser.id;

  return (
    <MessageItemLayout isAuthor={isAuthor}>
      <View className="flex flex-row gap-3 items-center">
        {!isAuthor && (
          <MessageItemAvatar photoUrl={selectedUser.photos[0].image_url[0]} />
        )}
        <MessageItemText text={item.message} />
        {isAuthor && (
          <MessageItemAvatar photoUrl={currentUser.photos[0].image_url[0]} />
        )}
      </View>
      <MessageItemStatusMark
        item={item}
        isAuthor={currentUser.id === selectedUser.id}
        shouldHide={page.page !== 1 || messageIndex !== 0}
      />
    </MessageItemLayout>
  );
};

export default MessageItem;
