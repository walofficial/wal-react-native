import React from "react";
import { User } from "@/lib/interfaces";
import MessageItemLayout from "../Chat/message-item-layout";
import { Text } from "react-native";

interface MessageItemProps {
  selectedUser: User;
  currentUser: User;
  content: React.ReactNode;
  isAuthor: boolean;
}

const SentMediaItem: React.FC<MessageItemProps> = ({
  content,
  selectedUser,
  currentUser,
  isAuthor,
}) => {
  return (
    <MessageItemLayout isAuthor={isAuthor}>
      <Text style={{ fontSize: 18, color: "white" }}>{content}</Text>
    </MessageItemLayout>
  );
};

export default SentMediaItem;
