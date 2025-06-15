import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/lib/theme";
import { toast } from "@backpackapp-io/react-native-toast";
import { ImagePickerAsset } from "expo-image-picker";
import { pasteImageFromClipboard } from "@/lib/clipboard";

interface ClipboardPasteButtonProps {
  onImagePasted: (image: ImagePickerAsset) => void;
  disabled?: boolean;
  maxImages?: number;
  currentImageCount?: number;
}

export default function ClipboardPasteButton({
  onImagePasted,
  disabled = false,
  maxImages = 3,
  currentImageCount = 0,
}: ClipboardPasteButtonProps) {
  const theme = useTheme();

  // Check if iOS 16+ native paste button is available
  const isNativePasteButtonAvailable =
    Platform.OS === "ios" && Clipboard.isPasteButtonAvailable;

  const handlePasteData = async (data: any) => {
    try {
      if (currentImageCount >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (data.type === "image") {
        // Convert native paste data to ImagePickerAsset format
        const timestamp = Date.now();
        const asset: ImagePickerAsset = {
          uri: data.data,
          width: data.size?.width || 0,
          height: data.size?.height || 0,
          fileSize: undefined,
          type: "image",
          fileName: `pasted_image_${timestamp}.jpg`,
          mimeType: "image/jpeg",
          exif: null,
          assetId: null,
          base64: null,
          duration: null,
        };

        onImagePasted(asset);
        toast.success("Image pasted successfully");
      } else if (data.type === "text") {
        // Handle text paste if needed
        console.log("Text pasted:", data.text);
      }
    } catch (error) {
      console.error("Error handling paste data:", error);
      toast.error("Failed to paste content");
    }
  };

  // For iOS 16+, use the native paste button
  if (isNativePasteButtonAvailable && !disabled) {
    return (
      <View style={styles.nativePasteContainer}>
        <Clipboard.ClipboardPasteButton
          style={[
            styles.nativePasteButton,
            {
              backgroundColor: theme.colors.primary + "10",
              borderColor: theme.colors.primary + "20",
            },
          ]}
          acceptedContentTypes={["image", "plain-text"]}
          onPress={handlePasteData}
          displayMode="iconAndLabel"
          cornerStyle="medium"
          backgroundColor={theme.colors.primary + "10"}
          foregroundColor={theme.colors.primary}
        />
      </View>
    );
  }

  // Fallback: return null since regular paste button is handled in PostControls
  return null;
}

const styles = StyleSheet.create({
  nativePasteContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  nativePasteButton: {
    height: 44,
    width: 120,
    borderRadius: 16,
    borderWidth: 1,
  },
});
