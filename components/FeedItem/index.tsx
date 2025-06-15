import React, { memo, useEffect, useMemo } from "react";
import { Text, Pressable, Image, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Pin } from "lucide-react-native";
import MediaContent from "./MediaContent";
import FeedActions from "./FeedActions";
import { isWeb } from "@/lib/platform";
import MenuView from "./MenuView";
import { formatRelativeTime } from "@/lib/utils/date";
import ExpandableText from "./ExpandableText";
import { useTheme } from "@/lib/theme";
import { ExternalVideo, LinkPreviewData } from "@/lib/interfaces";
import { useLinkPreview } from "@/hooks/useLinkPreview";
import LinkPreview from "../LinkPreview";
import { FactCheckResponse } from "@/lib/interfaces";
import useVerificationById from "@/hooks/useVerificationById";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import useAuth from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

// Simplified props interface - only including what's actually used
interface FeedItemProps {
  name: string;
  isLive: boolean;
  avatarUrl: string;
  time: string;
  isPinned: boolean;
  affiliatedIcon: string;
  hasRecording: boolean;
  verificationId: string;
  taskId: string;
  isPublic: boolean;
  friendId: string;
  canPin: boolean;
  text: string;
  text_summary?: string;
  isSpace: boolean;
  videoUrl: string;
  imageUrl: string;
  livekitRoomName: string;
  isVisible: boolean;
  isFactChecked?: boolean;
  imageGallery?: string[];
  title?: string;
  sources?: {
    title: string;
    uri: string;
  }[];
  externalVideo?: ExternalVideo;
  ai_video_summary_status?: "PENDING" | "COMPLETED" | "FAILED";
  fact_check_status?: "PENDING" | "COMPLETED" | "FAILED";
  fact_check_data?: FactCheckResponse;
  previewData?: LinkPreviewData;
  thumbnail?: string;
  isPreviewFeedItem?: boolean;
}

// Comparison function for memo - now includes all props since we simplified the interface
function arePropsEqual(prevProps: FeedItemProps, nextProps: FeedItemProps) {
  return (
    prevProps.friendId === nextProps.friendId &&
    prevProps.time === nextProps.time &&
    prevProps.name === nextProps.name &&
    prevProps.isLive === nextProps.isLive &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.affiliatedIcon === nextProps.affiliatedIcon &&
    prevProps.hasRecording === nextProps.hasRecording &&
    prevProps.verificationId === nextProps.verificationId &&
    prevProps.taskId === nextProps.taskId &&
    prevProps.isPublic === nextProps.isPublic &&
    prevProps.canPin === nextProps.canPin &&
    prevProps.text === nextProps.text &&
    prevProps.text_summary === nextProps.text_summary &&
    prevProps.isSpace === nextProps.isSpace &&
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.livekitRoomName === nextProps.livekitRoomName &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isFactChecked === nextProps.isFactChecked &&
    prevProps.title === nextProps.title &&
    prevProps.sources === nextProps.sources &&
    prevProps.imageGallery === nextProps.imageGallery &&
    prevProps.externalVideo === nextProps.externalVideo &&
    prevProps.ai_video_summary_status === nextProps.ai_video_summary_status &&
    prevProps.fact_check_status === nextProps.fact_check_status &&
    prevProps.fact_check_data === nextProps.fact_check_data &&
    prevProps.thumbnail === nextProps.thumbnail &&
    prevProps.isPreviewFeedItem === nextProps.isPreviewFeedItem
  );
}

function FeedItem({
  name,
  time,
  friendId,
  isLive,
  avatarUrl,
  isPinned,
  previewData,
  affiliatedIcon,
  hasRecording,
  verificationId,
  taskId,
  isPublic,
  canPin,
  text,
  text_summary,
  isSpace,
  videoUrl,
  imageUrl,
  livekitRoomName,
  isVisible,
  title,
  imageGallery,
  thumbnail,
  isPreviewFeedItem,
}: FeedItemProps) {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const formattedTime = formatRelativeTime(time);
  const { closeLightbox } = useLightboxControls();

  // This can be used for real time information as this is actually polling the data from the server
  const { data: verification } = useVerificationById(verificationId, true, {
    refetchInterval: 5000,
  });

  const handleProfilePress = () => {
    if (user?.id === friendId) {
      return;
    }
    router.navigate({
      pathname: `/profile`,
      params: {
        userId: friendId,
      },
    });
  };

  const localLinkPreview = useLinkPreview(text, false);
  // We check if the current fetched item has a preview, if doesn't we fallback to real time source, it might get populated later.
  // If not fallback to the local link preview.
  const hasPreview =
    !!previewData ||
    !!verification?.preview_data ||
    !!localLinkPreview.previewData;

  const previewDataToUse =
    verification?.preview_data || previewData || localLinkPreview.previewData;
  const realTimeImageUrl = verification?.image_gallery?.[0] || imageUrl;

  const MemoizedMediaContent = useMemo(() => {
    // Sometimes image gallery might be populated after the scraping of the post finishes. But item is already rendered.
    return (
      <MediaContent
        videoUrl={videoUrl}
        imageUrl={realTimeImageUrl}
        isLive={isLive}
        isVisible={isVisible}
        itemHeight={400}
        verificationId={verificationId}
        taskId={taskId}
        imageGallery={imageGallery}
        name={name}
        text={text}
        livekitRoomName={livekitRoomName}
        time={time}
        avatarUrl={avatarUrl}
        thumbnail={thumbnail}
        previewData={
          hasPreview && previewDataToUse ? previewDataToUse : undefined
        }
        hasAISummary={verification?.ai_video_summary_status === "COMPLETED"}
        factuality={verification?.fact_check_data?.factuality}
      />
    );
  }, [
    isVisible,
    verification?.image_gallery?.length,
    imageUrl,
    hasPreview,
    previewDataToUse,
    verification?.ai_video_summary_status,
  ]);
  // Create themed styles
  const themedStyles = {
    ...styles,
    nameText: {
      ...styles.nameText,
      color: theme.colors.text,
    },
    timeText: {
      ...styles.timeText,
      color: theme.colors.feedItem.secondaryText,
    },
    recordingText: {
      ...styles.recordingText,
      color: theme.colors.feedItem.secondaryText,
    },
    locationText: {
      ...styles.locationText,
      color: theme.colors.primary,
    },
    titleText: {
      ...styles.titleText,
      color: theme.colors.text,
    },
  };
  return (
    <View style={themedStyles.container}>
      <Pressable
        style={themedStyles.contentWrapper}
        onPress={() => {
          router.navigate({
            pathname: "/verification/[verificationId]",
            params: { verificationId },
          });
        }}
      >
        {!isPreviewFeedItem && (
          <View style={themedStyles.avatarContainer}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleProfilePress();
              }}
            >
              <Avatar
                alt="Avatar"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 35,
                  borderWidth: isLive ? 1 : 0,
                  borderColor: "transparent",
                }}
              >
                <AvatarImage
                  source={{ uri: avatarUrl }}
                  style={themedStyles.avatarImage}
                />
              </Avatar>
              {isLive && (
                <View style={themedStyles.liveIndicator}>
                  <Text style={themedStyles.liveText}>LIVE</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        <View style={themedStyles.contentContainer}>
          <View style={themedStyles.headerContainer}>
            <View style={themedStyles.headerLeft}>
              <View style={themedStyles.nameContainer}>
                {isPinned && (
                  <View style={themedStyles.pinnedContainer}>
                    <Pin color={"#FFD700"} fill="#FFD700" size={14} />
                  </View>
                )}
                <Text
                  style={[
                    themedStyles.nameText,
                    isPinned && themedStyles.pinnedText,
                  ]}
                >
                  {name}
                </Text>
                {affiliatedIcon && (
                  <Image
                    source={{ uri: affiliatedIcon }}
                    style={themedStyles.affiliatedIcon}
                  />
                )}

                <Text style={themedStyles.timeText}>· {formattedTime}</Text>
                {hasRecording && (
                  <Text style={themedStyles.recordingText}>· იყო ლაივში</Text>
                )}
              </View>
              {/* {locationName && (
                <Text style={themedStyles.locationText}>{locationName}</Text>
              )} */}
            </View>
            {!isWeb && (
              <MenuView
                verificationId={verificationId}
                friendId={friendId}
                isPublic={isPublic}
                canPin={canPin}
                isPinned={isPinned}
                taskId={taskId}
              />
            )}
          </View>
          {title && (
            <Pressable
              onPress={() => {
                if (!verificationId) return;
                const wasLightboxActive = closeLightbox();

                // If lightbox was active, wait for animation to complete before navigating
                if (wasLightboxActive) {
                  setTimeout(() => {
                    router.navigate({
                      pathname: "/verification/[verificationId]",
                      params: { verificationId },
                    });
                  }, 300);
                } else {
                  router.navigate({
                    pathname: "/verification/[verificationId]",
                    params: { verificationId },
                  });
                }
              }}
              android_ripple={{
                color: theme.colors.feedItem.secondaryText + "40",
              }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={themedStyles.titleText} numberOfLines={10}>
                {title}
              </Text>
            </Pressable>
          )}
          <ExpandableText
            text={text_summary || text}
            hideForSpace={isSpace}
            noVideoMargin={!!videoUrl}
            verificationId={verificationId}
            enableNavigation
            hasPreview={hasPreview}
          />

          {MemoizedMediaContent}

          {hasPreview && previewDataToUse && !realTimeImageUrl && (
            <LinkPreview
              previewData={previewDataToUse}
              isLoading={false}
              hasAISummary={
                verification?.ai_video_summary_status === "COMPLETED"
              }
              verificationId={verificationId}
              inFeedView={true}
              factuality={verification?.fact_check_data?.factuality}
            />
          )}
          <FeedActions
            // hideUserRects={isPreviewFeedItem || false}
            verificationId={verificationId}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    // backgroundColor: "#000",
    paddingTop: 16,
    paddingBottom: 0,
    paddingHorizontal: 8,
  },
  contentWrapper: {
    flexDirection: "row",
    width: "100%",
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 3,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  nameText: {
    fontWeight: "600",
    fontSize: 15,
    // color: "#E7E9EA",
  },
  pinnedText: {
    color: "#FFD700",
  },
  pinnedContainer: {
    marginRight: 6,
  },
  timeText: {
    fontWeight: "400",
    fontSize: 15,
    // color: "#71767B",
    marginLeft: 4,
  },
  recordingText: {
    fontWeight: "400",
    fontSize: 15,
    // color: "#71767B",
    marginLeft: 4,
  },
  locationText: {
    fontWeight: "500",
    fontSize: 13,
    // color: "#1D9BF0",
    marginTop: 2,
  },
  affiliatedIcon: {
    width: 16,
    height: 16,
    marginLeft: 2,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
    paddingRight: 20,
  },
  liveIndicator: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 10,
  },
});

export default memo(FeedItem, arePropsEqual);
