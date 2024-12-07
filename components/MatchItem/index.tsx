import React from "react";
import { View, TouchableHighlight } from "react-native";
import { Link } from "expo-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Match } from "@/lib/interfaces";
import useAuth from "@/hooks/useAuth";
import { Text } from "../ui/text";
import { H3, H4, P } from "../ui/typography";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/colors";

function Not({ item }: { item: Match }) {
  const { user } = useAuth();

  const userHasVerified =
    item.task_completer_user_ids?.includes(user.id) || false;
  const matchUserHasVerified = item?.task_completer_user_ids.includes(
    item.target_user.id
  );

  const locale = "ka";

  const taskTitle =
    locale === "ka"
      ? item.assigned_task?.display_name || ""
      : item.assigned_task?.task_title || "";

  // Decode the match creation date from the item.id
  const matchCreationDate = new Date(
    parseInt(item.id.substring(0, 8), 16) * 1000
  );

  return (
    <Link href={item.is_unmatched ? "#" : "(matches)/chat/" + item.id} asChild>
      <TouchableHighlight
        underlayColor="#2a2a2a"
        onPress={() => {}}
        className={cn(
          "flex flex-row border-b border-gray-900 transition-all cursor-pointer my-2 justify-between items-center w-full py-4 px-2 rounded-lg",
          {
            "opacity-50": item.is_unmatched,
          }
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
                  opacity:
                    !!matchUserHasVerified &&
                    !!userHasVerified &&
                    !item.is_unmatched
                      ? 0.5
                      : 1,
                }}
              >
                <AvatarImage
                  source={{ uri: item.target_user?.photos[0].image_url[0] }}
                />
                <AvatarFallback>
                  <Text>{item.target_user?.username || "[deleted]"}</Text>
                </AvatarFallback>
              </Avatar>
              {!!matchUserHasVerified &&
                !!userHasVerified &&
                !item.is_unmatched && (
                  <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                    <Ionicons name="checkmark" size={35} color={colors.blue} />
                  </View>
                )}
            </View>
            <View className="ml-3 flex-1">
              <View className="flex flex-row justify-between">
                <Text className="text-white text-xl">
                  {item.target_user?.username || "[deleted]"}
                </Text>

                <Text className="text-gray-400 text-sm">
                  {formatDistanceToNow(matchCreationDate, {
                    addSuffix: true,
                    locale: ka,
                  }).replace("დაახლოებით", "")}
                </Text>
              </View>
              <Text
                className="text-gray-400"
                ellipsizeMode="tail"
                numberOfLines={1}
              >
                {taskTitle}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
}

export default Not;
