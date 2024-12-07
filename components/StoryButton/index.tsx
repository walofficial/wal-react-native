import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Task } from "@/lib/interfaces";
import { Image } from "expo-image";
import VideoPlayback from "../VideoPlayback";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "@/components/ui/badge";
import { Text } from "../ui/text";
import { Platform } from "react-native";
import { convertToCDNUrl, isExampleSourceImage } from "@/lib/utils";

type StoryProps = {
  task: Task;
  verificationCount: number;
};

function formatNumber(num: number) {
  if (num < 1000) {
    return num >= 100 ? "99+" : num.toString();
  } else if (num >= 1000 && num < 10000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return Math.floor(num / 1000) + "K";
  }
}

const StoryButton = ({ verificationCount, task }: StoryProps) => {
  const navigate = useRouter();

  function renderMedia() {
    if (!isExampleSourceImage(task)) {
      return (
        <VideoPlayback
          isFullscreen={true}
          isBigPlayAlwaysHidden={true}
          topControls={null}
          bottomControls={null}
          cover
          src={
            Platform.OS === "ios"
              ? task.task_verification_example_sources[0].playback.hls
              : task.task_verification_example_sources[0].playback.dash
          }
          shouldPlay={false}
          preload={false}
          autoplay={false}
        />
      );
    }

    return (
      <Image
        source={{
          uri: convertToCDNUrl(
            task.task_verification_example_sources[0].image_media_url
          ),
        }}
        transition={1000}
        style={{ width: "100%", height: "100%" }}
      />
    );
  }

  return (
    <TouchableOpacity
      className="w-18 h-18 relative"
      onPress={() => {
        if (!verificationCount) {
          navigate.navigate({
            pathname: "/(tabs)/(explore)/task/[taskId]",
            params: {
              taskId: task.id,
            },
          });
          return;
        }
        navigate.navigate({
          pathname: "/(tabs)/(explore)/story/[taskId]",
          params: {
            taskId: task.id,
          },
        });
      }}
    >
      <LinearGradient
        colors={["gray", "gray", "gray"]}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={{
          height: 61,
          width: 61,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 61 / 2,
        }}
      >
        <View className={"h-16 w-16 rounded-full overflow-hidden"}>
          {renderMedia()}
        </View>
      </LinearGradient>
      {verificationCount !== 0 && (
        <Badge
          className="absolute pointer-events-none bottom-0 right-0 bg-pink-800 dark:bg-pink-800 shadow-md shadow-black"
          variant="secondary"
          style={{
            backgroundColor: "#2B4EFF",
          }}
        >
          <Text className="text-sm">
            {formatNumber(verificationCount || 0)}
          </Text>
        </Badge>
      )}
    </TouchableOpacity>
  );
};

export default StoryButton;
