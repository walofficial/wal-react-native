import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChatMessage } from "@/lib/interfaces";

interface MessageItemStatusMarkProps {
  item: ChatMessage;
  isAuthor: boolean;
  shouldHide?: boolean;
}

const MessageItemStatusMark: React.FC<MessageItemStatusMarkProps> = ({
  item,
  isAuthor,
  shouldHide,
}) => {
  const statusText = item.message_state;

  if (shouldHide || !statusText) {
    return null;
  }

  return (
    <View>
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
});

export default MessageItemStatusMark;
