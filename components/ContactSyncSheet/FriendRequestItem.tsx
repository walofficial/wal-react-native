import React from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FriendRequestStatus } from "@/lib/interfaces";

interface FriendRequestItemProps {
  user: {
    id: string;
    username: string;
    photos?: { image_url: string[] }[];
  };
  request: {
    id: string;
    status: FriendRequestStatus;
    sender_id: string;
  };
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  user,
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}) => {
  const imageUrl =
    user.photos && user.photos.length > 0
      ? user.photos[0].image_url[0]
      : undefined;

  return (
    <View className="flex-row items-center justify-between py-3 w-full">
      <View className="flex-row items-center">
        <Avatar
          className="border-2 p-1 border-gray-500 flex items-center justify-center"
          alt="Avatar"
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
          }}
        >
          <View
            style={{
              backgroundColor: !imageUrl ? "#36454F" : "transparent",
            }}
            className={cn("flex items-center justify-center w-full h-full", {
              "rounded-full": !imageUrl,
            })}
          >
            {imageUrl ? (
              <AvatarImage
                className="rounded-full"
                source={{ uri: imageUrl }}
              />
            ) : (
              <Text className="text-white text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </Avatar>
        <View className="ml-3">
          <Text className="text-lg font-semibold text-white">
            {user.username}
          </Text>
        </View>
      </View>
      {request.status === FriendRequestStatus.PENDING &&
        request.sender_id === user.id && (
          <View className="flex-row">
            <TouchableOpacity
              className="px-4 py-2 rounded-full bg-green-600 mr-2 flex-row items-center justify-center"
              onPress={() => onAccept(request.id)}
              disabled={isAccepting || isRejecting}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-full flex-row items-center justify-center"
              onPress={() => onReject(request.id)}
              disabled={isAccepting || isRejecting}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="close" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}
      {request.status === FriendRequestStatus.PENDING &&
        request.sender_id !== user.id && (
          <Text className="text-white font-bold">გაგზავნილია</Text>
        )}
      {request.status === FriendRequestStatus.ACCEPTED && (
        <Text className="text-green-500">Accepted</Text>
      )}
      {request.status === FriendRequestStatus.REJECTED && (
        <Text className="text-red-500">Rejected</Text>
      )}
    </View>
  );
};

export default FriendRequestItem;
