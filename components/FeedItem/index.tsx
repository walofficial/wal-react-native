import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Pressable, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Avatar, AvatarImage } from "../ui/avatar";
import SimplifiedVideoPlayback from "../SimplifiedVideoPlayback";
import { Task } from "@/lib/interfaces";
import { MenuView } from "@react-native-menu/menu";
import { Ionicons } from "@expo/vector-icons";
import useReportTask from "@/hooks/useReportTask";
import useBlockUser from "@/hooks/useBlockUser";
import LikeButton from "./LikeButton";
import LikeCount from "./LikeCount";
import { State, TapGestureHandler } from "react-native-gesture-handler";
import { useLikeButton } from "./LikeButton/useLikeButton";
import UserAvatarLayout from "../UserAvatar";
import useAuth from "@/hooks/useAuth";
import useDeleteFriendMutation from "@/hooks/useDeleteFriendMutation";
import ImpressionsCount from "./ImpressionsCount";
import ImageLoader from "../ImageLoader";
import { ka } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";
import { useMakePublicMutation } from "@/hooks/useMakePublicMutation";
import ShareButton from "./ShareButton";
import Share from "react-native-share";
import usePinVerification from "@/hooks/usePinVerification";
import useUnpinVerification from "@/hooks/useUnpinVerification";

interface FeedItemProps {
  name: string;
  time: string;
  imageUrl?: string;
  videoUrl?: string;
  avatarUrl: string;
  isVisible: boolean;
  itemHeight: number;
  headerHeight: number;
  verificationId: string;
  friendId: string;
  isStory?: boolean;
  text?: string;
  pictureUrl?: string;
  affiliatedIcon?: string;
  isProfilePage?: boolean;
  isPublic?: boolean;
  canPin?: boolean;
  isPinned?: boolean;
  locationName?: string;
}

function FeedItem({
  name,
  time = "",
  imageUrl,
  videoUrl,
  avatarUrl,
  isVisible,
  itemHeight,
  verificationId,
  friendId,
  isStory = false,
  text,
  affiliatedIcon,
  isPublic,
  redirectUrl,
  canPin,
  isPinned,
  locationName,
}: FeedItemProps) {
  const router = useRouter();
  const reportTask = useReportTask();
  const blockUser = useBlockUser();
  const { handleLike } = useLikeButton(verificationId);
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { user } = useAuth();

  const pinFeedItem = usePinVerification();
  const removePinnedFeedItem = useUnpinVerification();

  const deleteFriendMutation = useDeleteFriendMutation();
  const makePublicMutation = useMakePublicMutation(verificationId);

  const handleDeleteFriend = () => {
    deleteFriendMutation.mutate(friendId);
  };

  const handleBlockUser = () => {
    blockUser.mutate(friendId);
  };

  const handleMakePublic = (isPublic: boolean) => {
    makePublicMutation.mutate(isPublic);
  };

  const handleReport = () => {
    reportTask.mutate(verificationId);
  };

  const handlePin = () => {
    pinFeedItem.mutate({ taskId, verificationId });
  };

  const handleUnpin = () => {
    removePinnedFeedItem.mutate({ taskId, verificationId });
  };

  const handleShare = async () => {
    const shareUrl = `https://ment.ge/status/${verificationId}`;

    try {
      await Share.open({
        message: shareUrl,
        title: "Share this story",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const timeZone = getTimezoneOffset(
    "Asia/Tbilisi",
    time ? new Date(time.replace("Z", "")) : new Date()
  );

  const formattedTime = formatDistanceToNow(
    time
      ? new Date(time.replace("Z", "")).getTime() + timeZone
      : new Date().getTime(),
    {
      addSuffix: true,
      locale: ka,
    }
  )
    .replace("წუთზე ნაკლები ხნის წინ", "წუთის წინ")
    .replace("დაახლოებით ", "");

  const isAuthor = friendId === user.id;

  return (
    <View className={`flex-1 flex- w-full border-b border-gray-800/50 mb-4`}>
      <View className="flex flex-1 flex-row w-full">
        <View className="flex-shrink-0 w-12 mr-2">
          <Pressable
            onPress={() => {
              if (isAuthor) {
                return;
              }
              router.navigate({
                pathname: "/(tabs)/liveusers/feed/[taskId]/profile-picture",
                params: { imageUrl: avatarUrl, taskId, userId: friendId },
              });
            }}
          >
            <Avatar
              alt="Avatar"
              style={{
                width: 50,
                height: 50,
                borderRadius: 35,
              }}
            >
              <AvatarImage
                source={{ uri: avatarUrl }}
                className="w-full h-full rounded-full"
              />
            </Avatar>
          </Pressable>
        </View>

        <View className="flex-1 items-start pl-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className={`text-white text-lg font-semibold ${
                    isPinned ? "text-yellow-400" : ""
                  }`}
                >
                  {name}
                </Text>
                {affiliatedIcon && (
                  <Image
                    source={{ uri: affiliatedIcon }}
                    style={{
                      width: 16,
                      height: 16,
                      marginLeft: 5,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  />
                )}
                {isPinned && (
                  <View className="flex-row items-center ml-2 px-2 py-0.5 rounded-full">
                    <Ionicons name="pin" size={14} color="#FFD700" />
                  </View>
                )}
                <Text className="text-gray-400 text-sm ml-2">
                  · {formattedTime}
                </Text>
              </View>
              {locationName && (
                <Text className="text-md text-gray-400">{locationName}</Text>
              )}
            </View>
            <MenuView
              title="რა გსურთ?"
              onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === "report") {
                  handleReport();
                } else if (nativeEvent.event === "remove") {
                  handleDeleteFriend();
                } else if (nativeEvent.event === "block") {
                  handleBlockUser();
                } else if (nativeEvent.event === "hide-post") {
                  handleMakePublic(false);
                } else if (nativeEvent.event === "show-post") {
                  handleMakePublic(true);
                } else if (nativeEvent.event === "share") {
                  handleShare();
                } else if (nativeEvent.event === "pin") {
                  handlePin();
                } else if (nativeEvent.event === "unpin") {
                  handleUnpin();
                }
              }}
              themeVariant="dark"
              actions={
                isAuthor
                  ? [
                      {
                        id: "share",
                        title: "გაზიარება",
                      },
                      ...(canPin
                        ? [
                            {
                              id: isPinned ? "unpin" : "pin",
                              title: isPinned ? "დაპინვის წაშლა" : "დაპინვა",
                            },
                          ]
                        : []),
                      ...(isPublic
                        ? [
                            {
                              id: "hide-post",
                              title: "დამალვა",
                            },
                          ]
                        : [
                            {
                              id: "show-post",
                              title: "გამოჩენა ლოკაციაზე",
                            },
                          ]),
                    ]
                  : [
                      {
                        id: "share",
                        title: "გაზიარება",
                      },
                      ...(isStory
                        ? []
                        : [
                            {
                              id: "remove",
                              title: "მეგობრებიდან წაშლა",
                            },
                          ]),
                      {
                        id: "block",
                        title: "დაბლოკვა",
                        attributes: {
                          destructive: true,
                        },
                      },
                      {
                        id: "report",
                        title: "დაარეპორტე",
                        attributes: {
                          destructive: true,
                        },
                      },
                    ]
              }
            >
              <Pressable hitSlop={10}>
                <Ionicons name="ellipsis-horizontal" size={24} color={"#333"} />
              </Pressable>
            </MenuView>
          </View>

          {text && <Text className="text-white">{text}</Text>}

          <View className="flex flex-1 relative overflow-hidden flex-col w-full rounded-lg mb-4 mt-2">
            {videoUrl ? (
              <SimplifiedVideoPlayback
                onVideoPress={(playingTime: number) => {
                  if (!redirectUrl) {
                    return;
                  }

                  router.navigate({
                    pathname: redirectUrl,
                    params: {
                      verificationId,
                      taskId,
                      videoUrl,
                      imageUrl,
                      name,
                      time,
                      avatarUrl,
                    },
                  });
                }}
                src={videoUrl}
                shouldPlay={isVisible}
                minHeight={itemHeight}
                maxHeight={itemHeight}
              />
            ) : imageUrl ? (
              <View className="relative flex-1">
                <ImageLoader
                  source={{ uri: imageUrl }}
                  noAnimation={true}
                  className="w-full opacity-0 rounded-2xl"
                  style={{
                    height: itemHeight,
                    minHeight: itemHeight,
                    maxHeight: itemHeight,
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!redirectUrl) {
                      return;
                    }

                    router.navigate({
                      pathname: redirectUrl,
                      params: {
                        verificationId,
                        taskId,
                        videoUrl,
                        imageUrl,
                        name,
                        time,
                        avatarUrl,
                      },
                    });
                  }}
                  className="absolute inset-0 z-40 flex flex-row h-full w-full items-center justify-center bg-opacity-50"
                />
              </View>
            ) : null}

            <View className="flex-row justify-between z-50 items-center mt-2">
              <View className="flex-row items-center">
                <LikeButton verificationId={verificationId} />
                <LikeCount verificationId={verificationId} />
                <ShareButton verificationId={verificationId} />
              </View>
              <ImpressionsCount verificationId={verificationId} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default FeedItem;
