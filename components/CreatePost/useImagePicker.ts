import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { toast } from "@backpackapp-io/react-native-toast";
import {
  hasClipboardImage,
  pasteImageFromClipboard,
  copyImageToClipboard,
  addClipboardListener
} from "@/lib/clipboard";

const MAX_IMAGES = 3;

export function useImagePicker() {
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [hasClipboardImageAvailable, setHasClipboardImageAvailable] = useState(false);
  const [isPastingImage, setIsPastingImage] = useState(false);

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
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
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
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const handlePasteImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setIsPastingImage(true);
    try {
      const pastedImage = await pasteImageFromClipboard();
      if (pastedImage) {
        setSelectedImages([...selectedImages, pastedImage]);
        // Update clipboard status after pasting
        await checkClipboardImage();
      }
    } catch (error) {
      console.error("Error pasting image:", error);
      toast.error("Failed to paste image");
    } finally {
      setIsPastingImage(false);
    }
  };

  const handleCopyImage = async (imageUri: string) => {
    try {
      await copyImageToClipboard(imageUri);
    } catch (error) {
      console.error("Error copying image:", error);
      toast.error("Failed to copy image");
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
