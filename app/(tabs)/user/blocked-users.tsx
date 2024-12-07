import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import ContactSyncFriendItem from "@/components/ContactSyncSheet/ContactSyncFriendItem";
import useUnblockMutation from "@/hooks/useUnblockMutation";
import useGetBlockedUsers from "@/hooks/useGetBlockedUsers";

const BlockedUsers: React.FC = () => {
  const { blockedUsers, isLoading } = useGetBlockedUsers();

  const unblockUserMutation = useUnblockMutation();

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>არ გყავთ არავინ დაბლოკილი</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 py-3 px-3">
      {blockedUsers.map((user) => (
        <ContactSyncFriendItem
          key={user.id}
          user={user}
          onDelete={() => {}}
          onUnblock={() => handleUnblockUser(user.id)}
          isDeleting={false}
          isBlocked={true}
        />
      ))}
    </View>
  );
};

export default BlockedUsers;
