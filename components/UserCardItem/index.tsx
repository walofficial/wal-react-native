import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import ImageLoader from "@/components/ImageLoader";
import { MAX_CARD_HEIGHT_STYLE_PROP, cn } from "@/lib/utils";
import { FeedUser } from "@/lib/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { router } from "expo-router";
const CardItem = memo(
  function CardItem({
    currentUser,
    sources,
  }: {
    currentUser: FeedUser;
    sources?: string[];
  }) {
    const locale = "ka";
    const taskTitle =
      locale === "ka"
        ? currentUser.selected_task?.display_name || ""
        : currentUser.selected_task?.task_title || "";

    return (
      <View
        className={cn("relative w-full flex-1 rounded-lg overflow-hidden", {})}
        style={{
          maxHeight: MAX_CARD_HEIGHT_STYLE_PROP,
        }}
      >
        <View className="flex-1 p-0 flex-col">
          <View className="relative flex-1 w-full">
            <View
              style={{
                zIndex: 90,
              }}
              className="absolute w-full top-0 left-0 flex flex-row items-center justify-center"
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{
                  zIndex: 90,
                  width: "100%",
                }}
              >
                {/* <UserCardOverlayMedia
                type={currentUser.selected_task?.task_verification_media_type}
                imageSource={
                  currentUser.selected_task.task_verification_example_sources[0]
                    ? currentUser.selected_task
                        .task_verification_example_sources[0]?.image_media_url
                    : ""
                }
                mediaSources={
                  currentUser.selected_task
                    ?.task_verification_example_sources[0]
                    ? currentUser.selected_task
                        .task_verification_example_sources[0]
                        .transcoded_media_urls
                    : []
                }
              /> */}
                <View className="p-5 scroll-m-20 select-none w-full">
                  <Text
                    numberOfLines={2}
                    className="no-underline font-semibold text-3xl text-white"
                  >
                    {taskTitle}
                  </Text>
                  {/* {currentUser.selected_task.task_location?.name && (
                  <View className="text-white flex flex-row items-center">
                    <MapPin size={18} className="mr-1" />
                    <Text>{currentUser.selected_task.task_location?.name}</Text>
                  </View>
                )} */}
                </View>
              </LinearGradient>
            </View>

            {!currentUser.is_photos_hidden &&
              currentUser.photos[0]?.image_url && (
                <ImageLoader
                  alt="Photo 1"
                  blurhash={currentUser.photos[0]?.blur_hash}
                  source={
                    currentUser.photos[0]?.image_url
                      ? currentUser.photos[0].image_url[0]
                      : undefined || "/placeholder.svg"
                  }
                />
              )}
          </View>

          <View className="absolute w-full z-10 bottom-0 flex flex-col">
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                zIndex: 80,
              }}
            >
              <View className="w-full flex flex-col justify-between items-start p-2 pt-5 pb-2">
                <Text className="text-white text-2xl mb-3 font-semibold">
                  {currentUser.username}
                </Text>

                {currentUser.verified_task_completion_media.length > 0 &&
                  // <UserLastVerification
                  //   sources={currentUser.verified_task_completion_media}
                  // />
                  null}
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.currentUser.id === nextProps.currentUser.id
);

/* see task button

<TouchableOpacity
  style={{
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    overflow: "hidden",
  }}
  className="flex w-full flex-row items-center justify-center"
  onPress={() => {

    router.push({
      pathname: "/(tabs)/(dailypicks)/tasks/[categoryId]",
      params: {
        taskId: currentUser.selected_task?.id,
        categoryId: currentUser.selected_task?.task_category_id,
      },
    });
  }}
>
  <Ionicons name="play" size={24} color="white" />
  <Text className="text-white ml-4 text-lg">
    დავალების ნახვა
  </Text>
</TouchableOpacity> 

                */

export { CardItem as UserCardItem };
