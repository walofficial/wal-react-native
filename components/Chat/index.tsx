import { ChatList } from "./chat-list";
import React, { useEffect, useState } from "react";
import { User } from "@/lib/interfaces";

interface ChatProps {
  messages?: any[];
  selectedUser: User;
  isMobile: boolean;
  canText?: boolean;
}

export default function Chat({ selectedUser, isMobile, canText }: ChatProps) {
  return (
    <ChatList
      selectedUser={selectedUser}
      isMobile={isMobile}
      canText={canText}
    />
  );
}
