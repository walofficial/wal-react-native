"use client";

import React from "react";
import { Text, ActivityIndicator } from "react-native";
import { Video } from "react-native-compressor";
import { useAtomValue, useSetAtom } from "jotai";
import { verificationStatusState } from "../VerificationStatusView/atom";
import { useUploadVideo } from "@/hooks/useUploadVideo";
import { useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { Button } from "../ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SubmitButton({
  mediaBlob,
  isPhoto,
  onSubmit,
  caption,
}: {
  mediaBlob: any;
  isPhoto: boolean;
  onSubmit: () => void;
  caption?: string;
}) {
  const { taskId, recordingTime } = useLocalSearchParams<{
    taskId: string;
    recordingTime: string;
  }>();
  const setVerificationStatus = useSetAtom(verificationStatusState);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { uploadBlob } = useUploadVideo({
    taskId: taskId as string,
    isPhoto,
    isLocationUpload: true,
  });
  const insets = useSafeAreaInsets();
  const handleSubmit = async () => {
    setIsProcessing(true);
    onSubmit(); // This will navigate back to the chat screen

    try {
      console.log("Before path", mediaBlob.uri);
      let compressedPath = mediaBlob.uri;
      if (!isPhoto) {
        setVerificationStatus({
          status: "verification-pending",
          text: "იტვირთება...",
        });
        try {
          compressedPath = await Video.compress(
            mediaBlob.uri,
            { compressionMethod: "auto" },
            (progress) => {
              // setVerificationStatus({
              //   status: "verification-pending",
              //   text: `იტვირთება...`,
              // });
            }
          );
          console.log("Compressed path:", compressedPath);
        } catch (error) {
          console.error("Error during compression:", error);
          // setVerificationStatus({
          //   status: "verification-failed",
          //   text: "შეცდომა დაფიქსირდა",
          // });
        }
      }

      setVerificationStatus({
        status: "verification-pending",
        text: "იტვირთება...",
      });

      // Use the existing mutation to upload the media
      const formData = new FormData();
      formData.append(isPhoto ? "photo_file" : "video_file", {
        uri: "file://" + compressedPath,
        type: isPhoto ? "image/jpeg" : "video/mp4",
        name: compressedPath.split("/").pop(),
      });
      formData.append("task_id", taskId);
      formData.append("uri", "file://" + compressedPath);
      if (recordingTime) {
        formData.append("recording_time", recordingTime.toString());
      }
      formData.append("text_content", caption || "");
      await uploadBlob.mutateAsync({
        formData,
        uriPath: "file://" + compressedPath,
      });
    } catch (error) {
      console.error("Error during submission:", error);
      setVerificationStatus({
        status: "verification-failed",
        text: "შეცდომა დაფიქსირდა",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant={"secondary"}
      size={"lg"}
      onPress={handleSubmit}
      disabled={isProcessing || uploadBlob.isPending}
      className=" bg-pink-700 ml-1 text-lg flex flex-row"
    >
      {isProcessing || uploadBlob.isPending ? (
        <ActivityIndicator color="white" />
      ) : (
        <Check color="white" />
      )}
    </Button>
  );
}
