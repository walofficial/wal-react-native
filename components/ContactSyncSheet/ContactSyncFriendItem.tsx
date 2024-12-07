import React, { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { User } from "@/lib/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import UserAvatarChallange from "../UserAvatarChallange";
import { MenuView } from "@react-native-menu/menu";
import useBlockUser from "@/hooks/useBlockUser";

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
    <View className="flex-row items-center justify-between py-3 w-full">
      <View className="flex-row items-center">
        <UserAvatarChallange size="md" user={user} />
        <View className="ml-3">
          <Text className="text-lg font-semibold text-white">
            {user.username}
          </Text>
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
          className="px-4 py-2 rounded-full flex-row items-center justify-center"
        >
          <Ionicons name="close" size={24} color="gray" />
        </TouchableOpacity>
      </MenuView>
    </View>
  );
};

export default ContactSyncFriendItem;
