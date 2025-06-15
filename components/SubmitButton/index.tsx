"use client";

import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useUploadVideo } from "@/hooks/useUploadVideo";
import { useLocalSearchParams } from "expo-router";
import Button from "@/components/Button";
import { compressVideo } from "@/lib/media/video/compress";
import { compressIfNeeded } from "@/lib/media/manip";
import { useTheme } from "@/lib/theme";

export default function SubmitButton({
  mediaBlob,
  isPhoto,
  onSubmit,
  caption,
  videoDuration,
}: {
  mediaBlob: any;
  isPhoto: boolean;
  onSubmit: () => void;
  caption?: string;
  videoDuration?: string;
}) {
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { uploadBlob } = useUploadVideo({
    taskId: taskId as string,
    isPhoto,
    isLocationUpload: true,
  });
  const handleSubmit = async () => {
    setIsProcessing(true);
    onSubmit(); // This will navigate back to the chat screen

    try {
      let compressedPath = mediaBlob.uri;
      let compressedVideo = undefined;

      if (isPhoto) {
        // Compress photo if needed
        const compressedImage = await compressIfNeeded(
          {
            path: mediaBlob.uri,
            width: mediaBlob.width,
            height: mediaBlob.height,
            size: mediaBlob.size,
          },
          1000000
        ); // 1MB max size
        compressedPath = compressedImage.path;
      } else {
        // Video compression logic remains the same
        try {
          compressedVideo = await compressVideo(mediaBlob, {
            onProgress: (progress) => {},
          });
          compressedPath = compressedVideo.uri;
        } catch (error) {
          console.error("Error during compression:", error);
        }
      }

      // Use the existing mutation to upload the media
      const formData = new FormData();
      if (isPhoto) {
        formData.append("photo_file", {
          uri: "file://" + compressedPath,
          type: "image/jpeg",
          name: compressedPath.split("/").pop(),
        } as unknown as Blob);
      }
      formData.append("task_id", taskId);
      formData.append("uri", "file://" + compressedPath);
      if (videoDuration) {
        formData.append("recording_time", videoDuration.toString());
      }
      formData.append("text_content", caption || "");
      await uploadBlob.mutateAsync({
        formData,
        video: compressedVideo,
        params: {
          task_id: taskId,
          recording_time: videoDuration ? parseInt(videoDuration) : 0,
          text_content: caption || "",
        },
      });
    } catch (error) {
      console.error("Error during submission:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="medium"
      onPress={handleSubmit}
      disabled={isProcessing || uploadBlob.isPending}
      loading={isProcessing || uploadBlob.isPending}
      icon="checkmark"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
