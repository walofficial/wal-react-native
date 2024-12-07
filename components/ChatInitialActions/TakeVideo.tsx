import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CONTENT_SPACING } from "../CameraPage/Constants";
import { useAtomValue } from "jotai";
import { verificationStatusState } from "../VerificationStatusView/atom";
import { Large } from "../ui/typography";
import * as Progress from "react-native-progress";
import { Button } from "../ui/button";
import { toast } from "@backpackapp-io/react-native-toast";
import { useState } from "react";

export default function TakeVideo({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const verificationState = useAtomValue(verificationStatusState);

  const onTakeVideoClick = async () => {
    // Dismiss previous toasts if any
    toast.dismiss();

    // Check if user has seen the toast before
    const hasSeenToast = await AsyncStorage.getItem("hasSeenDeleteToast");
    if (!hasSeenToast) {
      toast("თქვენი ფოტო ან ვიდეო ავტომატურად წაიშლება 24 საათში");
      await AsyncStorage.setItem("hasSeenDeleteToast", "true");
    }

    try {
      const cachedVideoPath = await AsyncStorage.getItem(
        `lastRecordedVideoPath_${taskId}`
      );
      if (cachedVideoPath) {
        router.navigate({
          pathname: `/(tabs)/liveusers/feed/[taskId]/mediapage`,
          params: {
            taskId: taskId as string,
            path: cachedVideoPath,
            type: "video",
          },
        });
      } else {
        router.navigate({
          pathname: `/(tabs)/liveusers/feed/[taskId]/record`,
          params: {
            taskId: taskId as string,
          },
        });
      }
    } catch (e) {
      console.error("Error accessing camera or cached video:", e);
    }
  };

  const isVideoUploading = verificationState?.status === "video-uploading";

  return (
    <Button
      disabled={disabled}
      className="flex flex-row items-center"
      style={{
        width: 70,
        height: 70,
        borderRadius: 70 / 2,
        justifyContent: "center",
        backgroundColor: "#efefef",
        alignItems: "center",
      }}
      onPress={onTakeVideoClick}
    >
      {isVideoUploading ? (
        <ActivityIndicator color="black" />
      ) : isVideoUploading ? (
        <Progress.Pie
          progress={(verificationState?.percentage || 0) / 100}
          size={30}
          color="black"
        />
      ) : (
        <Ionicons name="camera" color="black" size={30} />
      )}
    </Button>
  );
}
