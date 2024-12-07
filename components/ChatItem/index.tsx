import React from "react";
import { View, TouchableHighlight } from "react-native";
import { Link } from "expo-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import { Text } from "../ui/text";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { ChatRoom } from "@/lib/interfaces";

function ChatItem({ item }: { item: ChatRoom }) {
  const { user: authorizedUser } = useAuth();

  const targetUser = item.participants.find(
    (user) => user.id !== authorizedUser.id
  );

  // Decode the match creation date from the item.id
  const matchCreationDate = new Date(
    parseInt(item.id.substring(0, 8), 16) * 1000
  );

  return (
    <Link
      href={{
        pathname: "/(tabs)/chatrooms/chat/[roomId]",
        params: { roomId: item.id },
      }}
      asChild
    >
      <TouchableHighlight
        underlayColor="#2a2a2a"
        onPress={() => {}}
        className={cn(
          "flex flex-row border-b border-gray-900 transition-all cursor-pointer my-2 justify-between items-center w-full py-4 px-2 rounded-lg"
        )}
      >
        <View className="flex flex-row w-[100%] justify-between items-center">
          <View className="flex flex-row items-center">
            <View className="relative">
              <Avatar
                alt="Avatar"
                style={{
                  width: 50,
                  height: 50,
                }}
              >
                <AvatarImage
                  source={{ uri: targetUser?.photos[0].image_url[0] }}
                />
                <AvatarFallback>
                  <Text>{targetUser?.username || "[deleted]"}</Text>
                </AvatarFallback>
              </Avatar>
            </View>
            <View className="ml-3 flex-1">
              <View className="flex flex-row justify-between">
                <Text className="text-white text-xl">
                  {targetUser?.username || "[deleted]"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
}

export default ChatItem;
