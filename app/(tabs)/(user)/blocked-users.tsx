import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import ContactSyncFriendItem from "@/components/ContactSyncSheet/ContactSyncFriendItem";
import useUnblockMutation from "@/hooks/useUnblockMutation";
import useGetBlockedUsers from "@/hooks/useGetBlockedUsers";
import { useTheme } from "@/lib/theme";

const BlockedUsers: React.FC = () => {
  const { blockedUsers, isLoading } = useGetBlockedUsers();
  const theme = useTheme();
  const unblockUserMutation = useUnblockMutation();

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate({
      path: {
        target_id: userId,
      },
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          არ გყავთ არავინ დაბლოკილი
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BlockedUsers;
