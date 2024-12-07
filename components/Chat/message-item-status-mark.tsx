import React from "react";
import { convertMessageState } from "@/lib/utils";
import { ChatMessage, User } from "@/interfaces";

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
  const statusText = convertMessageState(item.message_state, isAuthor);

  if (shouldHide || !statusText) {
    return null;
  }

  return (
    <span className="dark:text-white text-gray-400 text-xs">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {statusText}
      </span>
    </span>
  );
};

export default MessageItemStatusMark;
