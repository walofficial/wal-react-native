import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Text } from "@/components/ui/text";
import { User } from "@/lib/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import UserAvatarChallange from "../UserAvatarAnimated";
import { MenuView } from "@react-native-menu/menu";
import useBlockUser from "@/hooks/useBlockUser";
import { FontSizes } from "@/lib/theme";

interface FriendItemProps {
  user: User;
  onDelete: () => void;
  onUnblock: () => void;
  isDeleting: boolean;
  isBlocked: boolean;
}

const ContactSyncFriendItem: React.FC<FriendItemProps> = ({
  user,
  onDelete,
  onUnblock,
  isDeleting,
  isBlocked,
}) => {
  const blockUser = useBlockUser();

  const handleBlockUser = () => {
    Alert.alert(
      "დაბლოკვის დადასტურება",
      `ნამდვილად გსურთ ${user.username}-ის დაბლოკვა?`,
      [
        {
          text: "გაუქმება",
          style: "cancel",
        },
        {
          text: "დაბლოკვა",
          onPress: () => blockUser.mutate(user.id),
          style: "destructive",
        },
      ]
    );
  };

  const adds = [];

  if (!isBlocked) {
    adds.push({
      id: "remove",
      title: "მეგობრებიდან წაშლა",
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <UserAvatarChallange size="md" user={user} />
        <View style={styles.textContainer}>
          <Text style={styles.username}>{user.username}</Text>
        </View>
      </View>
      <MenuView
        title="რა გსურთ?"
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === "block") {
            handleBlockUser();
          } else if (nativeEvent.event === "remove") {
            onDelete();
          } else if (nativeEvent.event === "unblock") {
            onUnblock();
          }
        }}
        themeVariant="dark"
        actions={[
          ...adds,
          isBlocked
            ? {
                id: "unblock",
                title: "განბლოკვა",
              }
            : {
                id: "block",
                title: "დაბლოკვა",
                attributes: {
                  destructive: true,
                },
              },
        ]}
      >
        <TouchableOpacity
          disabled={isDeleting || blockUser.isPending}
          style={styles.menuButton}
        >
          <Ionicons name="close" size={24} color="gray" />
        </TouchableOpacity>
      </MenuView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    width: "100%",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
  },
  username: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
    color: "white",
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ContactSyncFriendItem;
