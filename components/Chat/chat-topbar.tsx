import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Info, Phone } from "@/lib/icons";
import { Video } from "expo-av";

import { isChatUserOnlineState } from "@/lib/state/chat";
import { useAtom } from "jotai";
import {
  Appearance,
  AppRegistry,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { Skeleton } from "../ui/skeleton";
import { Text } from "../ui/text";
import useUserChat from "@/hooks/useUserChat";
import { Link, router, useGlobalSearchParams, usePathname } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnUI,
} from "react-native-reanimated";
import { MenuView } from "@react-native-menu/menu";
import { useFriendRequest } from "@/lib/hooks/useFriendRequest";
import { useUnmatch } from "@/hooks/useUnmatch";
import { Platform } from "react-native";
import useGetUserVerification from "@/hooks/useGetUserVerification";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import { ResizeMode } from "expo-av";
import useMessageRoom from "@/hooks/useMessageRoom";
import useAuth from "@/hooks/useAuth";
import usePokeLiveUser from "@/hooks/usePokeUser";
import useBlockUser from "@/hooks/useBlockUser";
import { User } from "lucide-react-native";

export default function ChatTopbar({ pictureUrl }: { pictureUrl?: string }) {
  const { roomId, taskId } = useGlobalSearchParams<{
    roomId: string;
    taskId: string;
  }>();
  const { room, isFetching } = useMessageRoom(roomId);
  const { user } = useAuth();

  const [isChatUserOnline, setIsChatUserOnline] = useAtom(
    isChatUserOnlineState
  );
  const insets = useSafeAreaInsets();

  const selectedUser = room?.participants.find((p) => p.id !== user.id);

  const userPhoto = selectedUser?.photos[0]?.image_url[0];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const {
    mutate: sendFriendRequest,
    isSuccess,
    isPending: isSendingFriendRequest,
  } = useFriendRequest();

  useEffect(() => {
    if (isChatUserOnline) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
      scale.value = withTiming(1, { duration: 300, easing: Easing.elastic(1) });
    } else {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
      scale.value = withTiming(0.8, { duration: 300, easing: Easing.ease });
    }
  }, [isChatUserOnline]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleAddFriend = () => {
    if (selectedUser) {
      sendFriendRequest(selectedUser.id);
    }
  };

  const { pokeLiveUser } = usePokeLiveUser();
  const blockUser = useBlockUser();

  const handlePoke = () => {
    if (selectedUser) {
      pokeLiveUser.mutate({ userId: selectedUser.id, taskId: taskId });
    }
  };

  const menuItems = [
    {
      id: "poke",
      title: "უჯიკე",
      imageColor: "#2367A2",
    },
    {
      id: "addFriend",
      title: "მეგობრად დამატება",
      image: Platform.select({
        ios: "person.badge.plus",
        android: "ic_menu_add_gray",
      }),
      imageColor: "#2367A2",
    },
  ];

  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
      className="relative flex-1 flex flex-row items-center w-full bg-transparent"
    >
      <TouchableOpacity
        className="mr-5 pr-4 mb-3 items-center justify-center"
        onPress={() => {
          router.back();
        }}
      >
        <Ionicons name="chevron-back" size={30} color="#efefef" />
      </TouchableOpacity>
      <View className="flex flex-row items-center justify-between w-full flex-1 pb-4">
        <View className="flex flex-row items-center">
          <Pressable
            onPress={() => {
              if (userPhoto) {
                router.navigate({
                  pathname: pictureUrl,
                  params: {
                    taskId: taskId,
                    roomId: roomId,
                    imageUrl: userPhoto,
                  },
                });
              }
            }}
          >
            <View className="relative flex-1">
              <Avatar
                alt="User photo"
                className="flex flex-1 bg-gray-800 rounded-fullflex-row w-16 h-16 justify-center items-center"
              >
                {userPhoto ? (
                  <AvatarImage
                    source={{ uri: userPhoto }}
                    className="w-16 h-16"
                  />
                ) : (
                  <AvatarFallback>
                    <User size={30} color="#9ca3af" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Animated.View
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500"
                style={[
                  animatedStyle,
                  {
                    borderWidth: 2,
                    borderColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  },
                ]}
              />
            </View>
          </Pressable>
          <View className="flex flex-col ml-5">
            {selectedUser?.username ? (
              <Text className="text-2xl">{selectedUser?.username}</Text>
            ) : (
              <Skeleton className="w-32 h-4" />
            )}
          </View>
        </View>
        <View className="flex flex-row items-center">
          <MenuView
            title="რა გსურთ?"
            onPressAction={({ nativeEvent }) => {
              requestAnimationFrame(() => {
                runOnUI(() => {});
                if (nativeEvent.event === "addFriend") {
                  handleAddFriend();
                } else if (nativeEvent.event === "poke") {
                  handlePoke();
                }
              });
            }}
            themeVariant="dark"
            actions={menuItems}
          >
            <TouchableOpacity className="p-4">
              <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
            </TouchableOpacity>
          </MenuView>
        </View>
      </View>
    </View>
  );
}

// function OpenVerificationButton({
//   matchId,
//   userId,
//   type,
// }: {
//   matchId: string;
//   userId: string;
//   type: "video" | "image";
// }) {
//   const {
//     data: verification,
//     isFetching,
//     isSuccess,
//   } = useGetUserVerification(matchId as string, userId as string, true);

//   if (!verification) {
//     return null;
//   }

//   return (
//     <TouchableOpacity
//       onPress={() => {
//         router.navigate({
//           pathname: `/(tabs)/(matches)/chat/[matchId]/verification/[userId]`,
//           params: {
//             matchId: matchId,
//             userId: userId,
//           },
//         });
//       }}
//     >
//       <View
//         style={{ width: 50, height: 50 }}
//         className="rounded-xl overflow-hidden relative bg-gray-800"
//       >
//         <Video
//           source={{ uri: getVideoSrc(verification) }}
//           style={{ width: "100%", height: "100%" }}
//           resizeMode={ResizeMode.COVER}
//           shouldPlay={false}
//           isMuted={true}
//           isLooping={false}
//         />
//         <View
//           className="absolute inset-0 flex flex-row h-full w-full items-center justify-center bg-opacity-50"
//           style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
//         >
//           <Ionicons name={"play"} size={20} color="white" />
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// }
