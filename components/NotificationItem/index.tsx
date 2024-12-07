import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { cn } from "@/lib/utils";
import { NotificationResponse } from "@/lib/interfaces";
import { Text } from "../ui/text";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import useLiveUser from "@/hooks/useLiveUser";
import ImageLoader from "../ImageLoader";

function NotificationItem({ item }: { item: NotificationResponse }) {
  const router = useRouter();
  const { joinChatFromNotification } = useLiveUser();

  return (
    <TouchableOpacity
      onPress={() => {
        if (
          item.notification.type === "verification_like" ||
          item.notification.type === "impression"
        ) {
          router.navigate({
            pathname: `/(tabs)/notifications/post/[verificationId]`,
            params: {
              verificationId: item.notification.verification_id,
            },
          });
        } else if (item.notification.type === "poke") {
          joinChatFromNotification.mutate({
            targetUserId: item.from_user.id,
          });
        }
      }}
      className={cn(
        "flex flex-row transition-all cursor-pointer justify-between items-center w-full py-4 px-2 rounded-lg"
      )}
    >
      <View className="flex border-b border-gray-900 px-2 py-5 flex-row w-[100%] justify-between items-center">
        {item.notification.type !== "impression" && (
          <View className="flex flex-row items-center">
            <View className="relative">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  if (item.notification.type === "verification_like") {
                    router.navigate({
                      pathname: `/(tabs)/notifications/profile-picture`,
                      params: {
                        imageUrl: item.from_user?.photos[0].image_url[0],
                        userId: item.from_user?.id,
                      },
                    });
                  }
                }}
              >
                <View className="w-12 h-12 rounded-full overflow-hidden">
                  <ImageLoader
                    aspectRatio={1 / 1}
                    source={{ uri: item.from_user?.photos[0].image_url[0] }}
                    className="w-12 h-12 rounded-full"
                  />
                </View>
              </Pressable>
            </View>
          </View>
        )}
        <View className="ml-3 flex-1">
          <View className="flex flex-row justify-between">
            <Text className="text-white text-xl">
              {item.from_user?.username || "[deleted]"}
            </Text>

            <Text className="text-gray-400 text-sm">
              {formatDistanceToNow(item.notification.created_at, {
                addSuffix: true,
                locale: ka,
              }).replace("დაახლოებით", "")}
            </Text>
          </View>
          <View className="flex flex-row items-center mt-1">
            {item.notification.type === "verification_like" && (
              <View className="mr-1">
                <Ionicons name="heart" size={20} color="#ff3b30" />
              </View>
            )}
            <Text
              className="text-gray-400"
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {item.notification.type === "poke"
                ? "გიჯიკა"
                : item.notification.type === "impression"
                ? `დააგროავა ${item.notification.count} ნახვა`
                : "მოსწონს თქვენი ფოსტი"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
export default NotificationItem;
