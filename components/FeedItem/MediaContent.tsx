import React from "react";
import {
  View,
  Animated,
  ActionSheetIOS,
  Platform,
  Alert,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import SimplifiedVideoPlayback from "../SimplifiedVideoPlayback";
import { AutoSizedImage } from "../AutoSizedImage";
import ImageGrid from "../ImageGrid";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { measureHandle } from "@/lib/hooks/useHandleRef";
import { MeasuredDimensions, runOnJS, runOnUI } from "react-native-reanimated";
import { HandleRef } from "@/lib/hooks/useHandleRef";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import { Dimensions } from "@/components/Lightbox/ImageViewing/@types";
import { useTheme } from "@/lib/theme";
import { convertToCDNUrl } from "@/lib/utils";
import FactualityBadge from "../ui/FactualityBadge";
import useVerificationById from "@/hooks/useVerificationById";
import { LinkPreviewData } from "@/lib/interfaces";
import SourceIcon from "../SourceIcon";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface MediaContentProps {
  videoUrl?: string;
  imageUrl?: string;
  imageGallery?: string[];
  isLive?: boolean;
  isVisible: boolean;
  itemHeight: number;
  redirectUrl?: string;
  verificationId: string;
  taskId?: string;
  name: string;
  time: string;
  avatarUrl: string;
  livekitRoomName?: string;
  isSpace?: boolean;
  creatorUserId?: string;
  scheduledAt?: string;
  text?: string;
  mediaAlt?: string;
  thumbnail?: string;
  previewData?: LinkPreviewData;
  hasAISummary?: boolean;
  factuality?: number;
}

function MediaContent({
  videoUrl,
  imageUrl,
  imageGallery,
  isLive,
  isVisible,
  verificationId,
  taskId,
  livekitRoomName,
  isSpace,
  thumbnail,
  mediaAlt,
  previewData,
  factuality,
}: MediaContentProps) {
  const router = useRouter();

  // Calculate factuality badge info
  const getFactCheckBadgeInfo = (): {
    text: string;
    type: "truth" | "misleading" | "needs-context";
  } | null => {
    const score = factuality;

    if (score === undefined || score === null) {
      return null;
    }

    let badgeText = "";
    let badgeType: "truth" | "misleading" | "needs-context";

    if (score >= 0.75) {
      badgeText = `${Math.round(score * 100)}% სიმართლე`;
      badgeType = "truth";
    } else if (score >= 0.5) {
      badgeText = `${Math.round(score * 100)}% სიმართლე`;
      badgeType = "needs-context";
    } else {
      badgeText = `${Math.round((1 - score) * 100)}% სიცრუე`;
      badgeType = "misleading";
    }

    return { text: badgeText, type: badgeType };
  };

  const badgeInfo = getFactCheckBadgeInfo();

  const images =
    imageGallery && imageGallery.length > 0
      ? imageGallery
      : imageUrl
      ? [imageUrl]
      : [];

  const handleSingleTap = () => {
    // Only navigate if there are no images and no video (i.e., text-only content)
    if (images.length === 0 && !videoUrl) {
      router.navigate({
        pathname: "/verification/[verificationId]",
        params: {
          verificationId,
          taskId,
          livekitRoomName,
        },
      });
    }
  };

  const handleLongPress = (url: string, type: "photo" | "video") => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["გაუქმება", `გადმოწერა`],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await downloadMedia(url, type);
          }
        }
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert("გადმოწერა", `გსურს გადმოწერა?`, [
        { text: "გაუქმება", style: "cancel" },
        { text: "გადმოწერა", onPress: () => downloadMedia(url, type) },
      ]);
    }
  };

  const longPressGesture = Gesture.LongPress().onStart(() => {
    if (videoUrl) {
      runOnJS(handleLongPress)(videoUrl, "video");
    } else if (imageUrl) {
      runOnJS(handleLongPress)(imageUrl, "photo");
    }
  });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      // Only handle tap for navigation if there are no images and no video
      if (!videoUrl && images.length === 0) {
        runOnJS(handleSingleTap)();
      }
    });

  // Only apply navigation gesture if there are no images to show in lightbox
  const shouldApplyNavigationGesture = images.length === 0 && !videoUrl;
  const gestures = shouldApplyNavigationGesture
    ? Gesture.Exclusive(singleTapGesture, longPressGesture)
    : longPressGesture;

  const { openLightbox } = useLightboxControls();

  const items = images.map((img) => ({
    uri: img,
    thumbUri: img,
    alt: img,
    verificationId: verificationId,
    dimensions: { width: 1, height: 1 },
  }));

  const _openLightbox = (
    index: number,
    thumbRects: (MeasuredDimensions | null)[],
    fetchedDims: (Dimensions | null)[]
  ) => {
    openLightbox({
      images: items.map((item, i) => ({
        ...item,
        thumbRect: thumbRects[i] ?? null,
        thumbDimensions: fetchedDims[i] ?? null,
        type: "image",
      })),
      index,
    });
  };

  const downloadMedia = async (url: string, type: "photo" | "video") => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "თანხმობაა საჭირო",
          "საჭიროა თანხმობა სურათის ან ვიდეოს გადმოსაწერად"
        );
        return;
      }

      const filename = url.split("/").pop() || `downloaded-${type}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);

      await FileSystem.deleteAsync(uri); // Cleanup downloaded file after saving

      Alert.alert("შეინახულია");
    } catch (error) {
      Alert.alert("შეცდომა", "ვერ მოხერხდა გადმოწერა");
      console.error("Download error:", error);
    }
  };

  const handlePress = (
    index: number,
    containerRefs: HandleRef[],
    fetchedDims: (Dimensions | null)[]
  ) => {
    const handles = containerRefs.map((r) => r.current);

    runOnUI(() => {
      "worklet";
      const rects = handles.map(measureHandle);
      runOnJS(_openLightbox)(index, rects, fetchedDims);
    })();
  };

  const handlePressIn = (index: number) => {
    InteractionManager.runAfterInteractions(() => {
      Image.prefetch(images.map((img) => convertToCDNUrl(img)));
    });
  };

  if (isSpace) {
    if (!livekitRoomName) {
      return null;
    }

    return null;
  }

  if (!videoUrl && !imageUrl && !imageGallery?.length) return null;

  const renderContent = () => (
    <GestureDetector gesture={gestures}>
      <View style={styles.mediaContainer}>{renderMediaContent()}</View>
    </GestureDetector>
  );
  // Extract media content rendering to a separate function
  const renderMediaContent = () => (
    <>
      {images?.length > 1 ? (
        <ImageGrid
          images={images}
          onImagePress={handleSingleTap}
          aspectRatio={1}
          verificationId={verificationId}
        />
      ) : videoUrl ? (
        <SimplifiedVideoPlayback
          src={videoUrl}
          shouldPlay={isVisible}
          isLive={isLive}
          loop={false}
          thumbnail={convertToCDNUrl(thumbnail || "")}
        />
      ) : imageUrl || images[0] ? (
        <View style={styles.singleImageContainer}>
          <AutoSizedImage
            image={{
              thumb: { uri: images[0] },
              alt: mediaAlt || "Verification image",
              aspectRatio: { width: 1, height: 1.5 },
            }}
            onPressIn={() => handlePressIn(0)}
            onPress={(containerRef, dims) => {
              handlePress(0, [containerRef], [dims]);
            }}
            crop="constrained"
            hideBadge={false}
          />
          <View style={styles.lightboxButton} pointerEvents="none">
            <View style={styles.lightboxButtonBackground}>
              <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
          {(badgeInfo || previewData) && (
            <>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.linkPreviewGradient}
              />
              <View style={styles.linkPreviewContent} pointerEvents="none">
                {previewData && (
                  <>
                    <View style={styles.linkPreviewHeader}>
                      <SourceIcon sourceUrl={previewData.url} size={20} />
                    </View>
                    {previewData.title && (
                      <Text style={styles.linkPreviewTitle} numberOfLines={3}>
                        {previewData.title}
                      </Text>
                    )}
                    {previewData.description && (
                      <Text
                        style={styles.linkPreviewDescription}
                        numberOfLines={4}
                      >
                        {previewData.description}
                      </Text>
                    )}
                  </>
                )}
                {badgeInfo && (
                  <View style={styles.factualityBadgeOverlay}>
                    <FactualityBadge
                      text={badgeInfo.text}
                      type={badgeInfo.type}
                      style={styles.factualityBadge}
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      ) : null}
    </>
  );

  return renderContent();
}

const styles = StyleSheet.create({
  mediaContainer: {
    position: "relative",
    width: "100%",
    minHeight: 100,
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  singleImage: {
    width: "100%",
    borderRadius: 8,
    aspectRatio: 1.5,
  },
  singleImageContainer: {
    position: "relative",
    width: "100%",
  },
  factualityBadgeOverlay: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  factualityBadge: {},
  linkPreviewGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    zIndex: 5,
  },
  linkPreviewContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 6,
  },
  linkPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  aiSummaryBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiSummaryText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  linkPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
    lineHeight: 20,
  },
  linkPreviewDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 18,
  },
  lightboxButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  lightboxButtonBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MediaContent;
