import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React, { useEffect, useState } from "react";
import MessageConnectionWrapper from "./socket/MessageConnectionWrapper";
import { User } from "@/lib/interfaces";
import ProtocolService from "@/lib/services/ProtocolService";
import useSendPublicKey from "@/hooks/useSendPublicKey";
import useAuth from "@/hooks/useAuth";
interface ChatProps {
  messages?: any[];
  selectedUser: User;
  isMobile: boolean;
  canText?: boolean;
}

export default function Chat({ selectedUser, isMobile, canText }: ChatProps) {
  const [publicKey, setPublicKey] = useState("");
  const { sendPublicKey, isPending, isSuccess } = useSendPublicKey();
  const { user } = useAuth();
  useEffect(() => {
    if (selectedUser) {
      const generateKeys = async () => {
        // Send keys to server along with room creation
        const { identityKeyPair, registrationId } =
          await ProtocolService.generateIdentityKeyPair();
        setPublicKey(identityKeyPair.publicKey);
        sendPublicKey({
          userId: user.id,
          publicKey: identityKeyPair.publicKey,
        });
      };
      generateKeys();
    }
  }, [selectedUser]);

  if (!isSuccess) {
    return null;
  }
  return (
    <MessageConnectionWrapper publicKey={publicKey}>
      <ChatList
        selectedUser={selectedUser}
        isMobile={isMobile}
        canText={canText}
      />
    </MessageConnectionWrapper>
  );
}
