import React from "react";
import { ChatMessage, User } from "@/lib/interfaces";
import MessageItemLayout from "./message-item-layout";
import MessageItemText from "./message-item-text";
import MessageItemStatusMark from "./message-item-status-mark";
import MessageItemAvatar from "./message-item-avatar";
import { View, StyleSheet } from "react-native";

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
      <View style={styles.messageContainer}>
        {!isAuthor && (
          <MessageItemAvatar photoUrl={selectedUser.photos[0].image_url[0]} />
        )}
        {/* <MessageItemText text={item.message} isAuthor={isAuthor} /> */}
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

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});

export default MessageItem;
