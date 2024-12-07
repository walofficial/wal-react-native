import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import ContactListHeader from "./ContactListHeader";
import { FriendRequestStatus } from "@/lib/interfaces";
import FriendRequestItem from "./FriendRequestItem";
import { useFriendRequestActions } from "@/hooks/useFriendRequestActions";
import { useFriendRequests } from "@/hooks/useFriendRequests";

interface FriendRequestsProps {
  hideMyRequests?: boolean;
  limit?: number;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({
  hideMyRequests = false,
  limit = 999,
}) => {
  const { friendRequests } = useFriendRequests();

  const { acceptRequest, rejectRequest, isAccepting, isRejecting } =
    useFriendRequestActions();

  const handleAccept = (requestId: string) => {
    acceptRequest(requestId);
  };

  const handleReject = (requestId: string) => {
    rejectRequest(requestId);
  };

  if (!friendRequests || friendRequests.length === 0) {
    return null;
  }

  const filteredRequests = hideMyRequests
    ? friendRequests.filter(
        ({ request, user }) => request.sender_id === user.id
      )
    : friendRequests;

  if (filteredRequests.length === 0) {
    return null;
  }

  return (
    <View className="mb-3">
      <ContactListHeader
        icon="person-add-outline"
        title="მეგობრობის მოთხოვნები"
      />
      {filteredRequests.slice(0, limit).map(({ user, request }) => (
        <FriendRequestItem
          key={request.id}
          user={user}
          request={request}
          onAccept={() => handleAccept(request.id)}
          onReject={() => handleReject(request.id)}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
        />
      ))}
    </View>
  );
};

export default FriendRequests;
