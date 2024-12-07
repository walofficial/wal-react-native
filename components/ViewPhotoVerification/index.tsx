import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { cn, convertToCDNUrl } from "@/lib/utils";
import ImageLoader from "../ImageLoader";
import CloseButton from "../CloseButton";
import TaskPreviewOverlay from "../TaskPreviewOverlay";
import { Task } from "@/lib/interfaces";
import TaskBottomOverlay from "../TaskBottomOverlay";
import { BlurView } from "expo-blur";
import { useAtomValue } from "jotai";
import { dimensionsState } from "../ActualDimensionsProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopGradient from "../VideoPlayback/TopGradient";

function ViewPhotoVerification({
  src,
  task,
  topControls = null,
  isFullscreen = false,
  hideChallangeButton = false,
}: {
  src: string;
  task: Task;
  topControls?: React.ReactNode;
  isFullscreen?: boolean;
  hideChallangeButton?: boolean;
}) {
  const taskTitle = task.display_name;
  const imageUrl = convertToCDNUrl(src);
  const insets = useSafeAreaInsets();

  const { width: actualWidth, height: actualHeight } = useAtomValue(
    dimensionsState
  ) ?? { width: 0, height: 0 };

  const containerStyle = useMemo(
    () => ({
      width: isFullscreen ? "100%" : actualWidth,
      height: isFullscreen
        ? actualHeight
        : actualHeight - (Platform.OS === "ios" ? insets.top : 0),
    }),
    [actualWidth, actualHeight, insets, isFullscreen]
  );

  function renderVerification() {
    return (
      <View className="flex-1 items-center">
        <TopGradient topControls={topControls} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: -1, backgroundColor: "black" },
          ]}
        >
          <ImageLoader
            contentFit="cover"
            alt="Blurred Background"
            source={imageUrl}
          />
          <BlurView
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            tint="dark"
            intensity={560}
          />
        </View>
        <ImageLoader contentFit="contain" alt="Photo 1" source={imageUrl} />
        <View
          style={{
            zIndex: 100,
          }}
          className="absolute bottom-0 left-0 right-0"
        >
          <TaskBottomOverlay>
            <TaskPreviewOverlay
              hideChallengeButton={hideChallangeButton}
              display_name={taskTitle}
              task_location={task.task_location}
              id={task.id}
              task_description={task.task_description}
            />
          </TaskBottomOverlay>
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        flex: 1,

        ...containerStyle,
      }}
    >
      {renderVerification()}
    </View>
  );
}

export default ViewPhotoVerification;
