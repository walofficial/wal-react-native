import React from "react";
import * as MediaLibrary from "expo-media-library";

// import {saveImageToMediaLibrary, shareImageModal} from '#/lib/media/manip'
import { useLightbox, useLightboxControls } from "@/lib/lightbox/lightbox";
import ImageView from "./ImageViewing";
import { toast } from "@backpackapp-io/react-native-toast";

export function Lightbox() {
  const { activeLightbox } = useLightbox();
  const { closeLightbox } = useLightboxControls();

  const onClose = React.useCallback(() => {
    closeLightbox();
  }, [closeLightbox]);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ["photo"],
  });
  const saveImageToAlbumWithToasts = React.useCallback(
    async (uri: string) => {
      if (!permissionResponse || permissionResponse.granted === false) {
        toast.error("Permission to access camera roll is required.");
        if (permissionResponse?.canAskAgain) {
          requestPermission();
        } else {
          toast.error(
            "Permission to access camera roll was denied. Please enable it in your system settings."
          );
        }
        return;
      }
      try {
        // await saveImageToMediaLibrary({ uri });
        toast.success("Saved to your camera roll");
      } catch (e: any) {
        toast.error(`Failed to save image: ${String(e)}`);
      }
    },
    [permissionResponse, requestPermission]
  );

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={saveImageToAlbumWithToasts}
      onPressShare={(uri) => {
        // toast("Share image");
      }}
    />
  );
}
