import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  hasClipboardImage,
  pasteImageFromClipboard,
  copyImageToClipboard,
  addClipboardListener
} from "@/lib/clipboard";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

const MAX_IMAGES = 3;

export function useImagePicker() {
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [hasClipboardImageAvailable, setHasClipboardImageAvailable] = useState(false);
  const [isPastingImage, setIsPastingImage] = useState(false);
  const { error: errorToast } = useToast();

  // Check clipboard on mount and set up listener
  useEffect(() => {
    checkClipboardImage();

    // Set up clipboard listener for real-time updates
    const subscription = addClipboardListener((hasImage, hasText) => {
      setHasClipboardImageAvailable(hasImage);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkClipboardImage = async () => {
    try {
      const hasImage = await hasClipboardImage();
      setHasClipboardImageAvailable(hasImage);
    } catch (error) {
      console.warn("Error checking clipboard:", error);
    }
  };

  const handleImagePick = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      errorToast({
        title: t("errors.max_images_reached", { count: MAX_IMAGES }),
        description: t("errors.max_images_reached", { count: MAX_IMAGES })
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - selectedImages.length,
    });

    if (!result.canceled) {
      const newImages = result.assets;
      if (selectedImages.length + newImages.length > MAX_IMAGES) {
        errorToast({
          title: t("errors.max_images_reached", { count: MAX_IMAGES }),
          description: t("errors.max_images_reached", { count: MAX_IMAGES })
        });
        return;
      }
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const handlePasteImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      errorToast({
        title: t("errors.max_images_reached", { count: MAX_IMAGES }),
        description: t("errors.max_images_reached", { count: MAX_IMAGES })
      });
      return;
    }

    setIsPastingImage(true);
    try {
      const pastedImage = await pasteImageFromClipboard((message) => {
        errorToast({
          title: message,
          description: message
        });
      });
      if (pastedImage) {
        setSelectedImages([...selectedImages, pastedImage]);
        // Update clipboard status after pasting
        await checkClipboardImage();
      }
    } catch (error) {
      console.error("Error pasting image:", error);
    } finally {
      setIsPastingImage(false);
    }
  };

  const handleCopyImage = async (imageUri: string) => {
    try {
      await copyImageToClipboard(imageUri);
    } catch (error) {
      console.error("Error copying image:", error);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return {
    selectedImages,
    handleImagePick,
    handlePasteImage,
    handleCopyImage,
    removeImage,
    setSelectedImages,
    hasClipboardImageAvailable,
    isPastingImage,
    checkClipboardImage,
  };
}
