import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Avatar, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ka } from "date-fns/locale";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { getCurrentLocale } from "@/lib/i18n";

interface CommentItemProps {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    profilePicture: string;
  };
  likesCount: number;
  isLiked: boolean;
  onLike: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
}

const CommentItem = ({
  id,
  body,
  createdAt,
  author,
  onDelete,
  onReport,
}: CommentItemProps) => {
  const router = useRouter();
  const { user } = useAuth();

  const isAuthor = author.id === user?.id;

  const handleProfilePress = () => {
    router.push({
      pathname: "/(tabs)/(home)/profile",
      params: { userId: author.id },
    });
  };

  const handleDelete = () => {
    if (window.confirm("ნამდვილად გსურთ კომენტარის წაშლა?")) {
      onDelete?.();
    }
  };

  const getTimeText = () => {
    const diffInMinutes = differenceInMinutes(new Date(), createdAt);
    if (diffInMinutes < 1) {
      return "ახლა";
    }
    const locale = getCurrentLocale();
    return formatDistanceToNow(createdAt, {
      addSuffix: true,
      locale: locale === "ka" ? ka : undefined,
    });
  };

  return (
    <View className="flex-row p-4 border-b border-gray-800/50 hover:bg-gray-800/10 transition-colors">
      <TouchableOpacity onPress={handleProfilePress}>
        <Avatar className="w-8 h-8 mr-3" alt={author.username}>
          <AvatarImage source={{ uri: author.profilePicture }} />
        </Avatar>
      </TouchableOpacity>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text
              className="font-semibold text-white cursor-pointer hover:underline"
              onPress={handleProfilePress}
            >
              {author.username}
            </Text>
            <Text className="text-gray-400 text-sm ml-2">{getTimeText()}</Text>
          </View>
        </View>

        <Text className="text-white mt-1">{body}</Text>
      </View>
    </View>
  );
};

export default CommentItem;
