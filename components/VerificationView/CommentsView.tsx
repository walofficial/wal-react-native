import React, {
  useRef,
  useCallback,
  useMemo,
  memo,
  useState,
  useEffect,
} from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import CommentsList from "@/components/Comments/CommentsList";
import useAuth from "@/hooks/useAuth";
import LiveStreamViewer from "@/components/LiveStreamViewer";
import SpaceView from "@/components/FeedItem/SpaceView";
import { LocationFeedPost, Source } from "@/lib/interfaces";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import { useAtomValue, useAtom } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import FeedActions from "../FeedItem/FeedActions";
import { FontSizes, useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";
import { SourceIcon } from "@/components/SourceIcon";
import { activeSourcesState, newsBottomSheetState } from "@/lib/atoms/news";
import { formatRelativeTime } from "@/lib/utils/date";
import { CheckCircle } from "lucide-react-native";
import PostHeader from "./PostHeader";
import FeedItemMediaContent from "@/components/FeedItem/MediaContent";
import FactCheckBox from "@/components/ui/FactCheckBox";
import AISummaryBox from "@/components/ui/AISummaryBox";
import { useLinkPreview } from "@/hooks/useLinkPreview";
import LinkPreview from "@/components/LinkPreview";
import CommentInput from "../Comments/CommentInput";
import useKeyboardVerticalOffset from "@/hooks/useKeyboardVerticalOffset";
import { isIOS } from "@/lib/platform";
import RenderMdx from "../RenderMdx/index";
import useVerificationById from "@/hooks/useVerificationById";
import NewsSourcesBottomSheet from "../FeedItem/NewsSourcesBottomSheet";
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import FactCheckBottomSheet from "../FactCheckBottomSheet";
import FactualityBadge, {
  FactualityBadgeType,
} from "@/components/ui/FactualityBadge";
import { Image } from "expo-image";
import { getFaviconUrl } from "@/utils/urlUtils";

// Reusable component for rendering sources section
const SourcesSection = memo(
  ({
    sources,
    onPress,
  }: {
    sources?: Array<{ uri: string; title?: string; domain?: string }> | null;
    onPress: () => void;
  }) => {
    const theme = useTheme();
    const { isDarkColorScheme } = useColorScheme();
    const maxSources = 5;
    if (!sources || sources.length === 0) return null;

    // Filter sources to only include unique domains/hosts
    const uniqueSources = useMemo(() => {
      const uniqueDomains = new Set();
      return sources.filter((source) => {
        try {
          const url = new URL(source.uri);
          const domain = url.hostname;
          if (uniqueDomains.has(domain)) {
            return false;
          }
          uniqueDomains.add(domain);
          return true;
        } catch (e) {
          // If URL parsing fails, include the source
          return true;
        }
      });
    }, [sources]);

    return (
      <TouchableOpacity
        style={[
          styles.sourcesHorizontalContainer,
          styles.sourcesContainer,
          {
            backgroundColor: isDarkColorScheme
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.02)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDarkColorScheme
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            paddingVertical: 12,
            paddingHorizontal: 16,
          },
        ]}
        onPress={onPress}
      >
        <View style={styles.sourcesRow}>
          <View style={styles.sourcesIconsContainer}>
            {uniqueSources.slice(0, maxSources).map((source, index) => (
              <SourceIcon
                key={index}
                sourceUrl={source.uri}
                fallbackUrl={source.uri}
              />
            ))}
            {uniqueSources.length > maxSources && (
              <View
                style={[
                  styles.sourceIconRounded,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <Text
                  style={[styles.sourceCountText, { color: theme.colors.text }]}
                >
                  +{uniqueSources.length - maxSources}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.sourcesLabel,
              {
                backgroundColor: isDarkColorScheme
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
          >
            <Text
              style={[
                styles.sourcesLabelText,
                { color: theme.colors.text, opacity: 0.8 },
              ]}
            >
              {uniqueSources.length} წყარო{uniqueSources.length !== 1 ? "" : ""}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

SourcesSection.displayName = "SourcesSection";

// Top Metadata Section Component (Sources + Factuality)
const TopMetadataSection = memo(
  ({
    verification,
    onSourcePress,
  }: {
    verification: LocationFeedPost;
    onSourcePress: () => void;
  }) => {
    const theme = useTheme();
    const { isDarkColorScheme } = useColorScheme();

    // Get unique sources similar to NewsCardItem
    const uniqueSources = useMemo(() => {
      if (!verification.sources || verification.sources.length === 0) return [];

      const uniqueDomains = new Set();
      return verification.sources.filter((source) => {
        try {
          const url = new URL(source.uri);
          const domain = url.hostname;
          if (uniqueDomains.has(domain)) {
            return false;
          }
          uniqueDomains.add(domain);
          return true;
        } catch (e) {
          return true;
        }
      });
    }, [verification.sources]);

    // Calculate factuality badge info similar to NewsCardItem
    const badgeInfo = useMemo((): {
      text: string;
      type: "truth" | "misleading" | "neutral";
    } | null => {
      // Check if verification has factuality property (it might not exist on this type)
      const score = verification.fact_check_data?.factuality;

      if (score === undefined || score === null) {
        return null;
      }

      let badgeText = "";
      let badgeType: "truth" | "misleading" | "neutral" = "neutral";

      if (score >= 0.5) {
        badgeText = `${Math.round(score * 100)}% სიმართლე`;
        badgeType = "truth";
      } else {
        badgeText = `${Math.round((1 - score) * 100)}% სიცრუე`;
        badgeType = "misleading";
      }

      return { text: badgeText, type: badgeType };
    }, [verification.fact_check_data?.factuality]);

    const sharedBadgeType: FactualityBadgeType | undefined = useMemo(() => {
      if (!badgeInfo) return undefined;

      if (badgeInfo.type === "neutral") {
        return "needs-context";
      } else {
        return badgeInfo.type as FactualityBadgeType;
      }
    }, [badgeInfo]);

    if (uniqueSources.length === 0 && !badgeInfo) return null;

    return (
      <View style={styles.topMetadataContainer}>
        <View style={styles.metadataRow}>
          {/* Sources Section */}
          {uniqueSources.length > 0 && (
            <TouchableOpacity
              style={[
                styles.sourcesCompactContainer,
                {
                  backgroundColor: isDarkColorScheme
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDarkColorScheme
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
              onPress={onSourcePress}
            >
              <View style={styles.sourcesCompactRow}>
                <View style={styles.sourceIconsCompactContainer}>
                  {uniqueSources.length > 6 && (
                    <View
                      style={[
                        styles.moreSourcesIndicator,
                        {
                          backgroundColor: isDarkColorScheme
                            ? "#e0e0e0"
                            : "#808080",
                          borderColor: theme.colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.moreSourcesText,
                          { color: isDarkColorScheme ? "#333333" : "#ffffff" },
                        ]}
                      >
                        +{uniqueSources.length - 3}
                      </Text>
                    </View>
                  )}
                  {uniqueSources
                    .slice(0, 6)
                    .reverse()
                    .map((source, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.sourceIconCompact,
                          {
                            marginRight: idx > 0 ? -8 : 0,
                            zIndex: 3 - idx,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: getFaviconUrl(source.uri) }}
                          style={[
                            styles.sourceIconImage,
                            {
                              borderColor: theme.colors.background,
                            },
                          ]}
                        />
                      </View>
                    ))}
                </View>
                <Text
                  style={[
                    styles.sourcesCompactLabel,
                    { color: theme.colors.text, opacity: 0.7 },
                  ]}
                >
                  {uniqueSources.length} წყარო
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Factuality Badge */}
          {badgeInfo && sharedBadgeType && (
            <View style={styles.factualityWrapper}>
              <FactualityBadge
                text={badgeInfo.text}
                type={sharedBadgeType}
                style={[styles.factualityBadge]}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
);

TopMetadataSection.displayName = "TopMetadataSection";

// Post Content Component
const PostContent = memo(
  ({
    verification,
    verificationId,
    handleMediaPress,
    user,
  }: {
    verification: LocationFeedPost;
    verificationId: string;
    handleMediaPress: () => void;
    user: any;
  }) => {
    const theme = useTheme();
    const imageUrl =
      convertToCDNUrl(verification.verified_image || "") ||
      verification.image_gallery?.[0];
    const mediaSource = getVideoSrc(verification);
    const title = verification.title;
    const isLive = verification.is_live;
    const isSpace = verification.is_space;
    const [, setActiveSources] = useAtom(activeSourcesState);
    const [, setIsBottomSheetOpen] = useAtom(newsBottomSheetState);
    const handleSourcePress = useCallback(() => {
      if (verification.sources && verification.sources.length > 0) {
        setActiveSources(verification.sources);
        setIsBottomSheetOpen(true);
      }
    }, [verification.sources, setActiveSources, setIsBottomSheetOpen]);

    const localLinkPreview = useLinkPreview(
      verification.text_content || "",
      false
    );
    const hasPreview =
      !!verification.preview_data || !!localLinkPreview.previewData;
    const visibleTextContent = hasPreview
      ? (verification.text_content || "")
          .replace(/(https?:\/\/[^\s]+)/g, "")
          .trim()
      : (verification.text_content || "").trim();
    // --- END FEED ITEM-LIKE PREVIEW LOGIC ---

    // Handle Space view
    if (isSpace && verification.livekit_room_name) {
      return (
        <View style={styles.postContentContainer}>
          <View style={styles.spaceContainer}>
            <SpaceView
              description={verification.text_content || ""}
              roomName={verification.livekit_room_name}
              isHost={verification.assignee_user.id === user.id}
              scheduledAt={verification.scheduled_at}
            />
          </View>
          <View style={styles.actionsContainer}>
            <FeedActions
              verificationId={verificationId}
              sourceComponent={null}
            />
          </View>
        </View>
      );
    }
    // Handle Live stream
    if (isLive && verification.livekit_room_name) {
      return (
        <View style={styles.postContentContainer}>
          <View style={styles.textContentContainer}>
            {title && (
              <Text style={[styles.titleText, { color: theme.colors.text }]}>
                {title}
              </Text>
            )}
            {visibleTextContent && (
              <Text
                style={[
                  styles.textContent,
                  { color: theme.colors.text, opacity: 0.9 },
                ]}
              >
                {visibleTextContent}
              </Text>
            )}
            <LiveStreamViewer
              liveKitRoomName={verification.livekit_room_name}
              topControls={<View />}
            />
          </View>
          <View style={styles.actionsContainer}>
            <FeedActions
              verificationId={verificationId}
              sourceComponent={null}
            />
          </View>
        </View>
      );
    }
    // Regular post
    return (
      <View style={styles.postContentContainer}>
        <View style={styles.textContentContainer}>
          {title && (
            <Text
              style={[
                styles.titleText,
                {
                  color: theme.colors.text,
                  opacity: 1, // Full opacity for title to make it stand out more
                },
              ]}
            >
              {title}
            </Text>
          )}

          {visibleTextContent && (
            <View style={{ opacity: 0.8 }}>
              <RenderMdx content={visibleTextContent} />
            </View>
          )}
          <FeedItemMediaContent
            videoUrl={mediaSource}
            imageUrl={imageUrl}
            imageGallery={verification.image_gallery}
            isLive={isLive}
            isVisible={true}
            itemHeight={300}
            verificationId={verificationId}
            name={verification.assignee_user?.username || user.username}
            time={verification.last_modified_date}
            avatarUrl={
              verification.assignee_user?.photos[0]?.image_url[0] ||
              user.photos[0]?.image_url[0]
            }
            livekitRoomName={verification.livekit_room_name}
            isSpace={isSpace}
            scheduledAt={verification.scheduled_at}
            text={verification.text_content}
            thumbnail={verification.verified_media_playback?.thumbnail}
            mediaAlt="Verification image"
            creatorUserId={verification.assignee_user?.id}
            previewData={
              verification.preview_data ||
              localLinkPreview.previewData ||
              undefined
            }
            hasAISummary={
              verification.ai_video_summary_status === "COMPLETED" ||
              verification.ai_video_summary_status === "PENDING"
            }
          />
          {hasPreview && !imageUrl && !verification.image_gallery?.length && (
            <LinkPreview
              previewData={
                verification.preview_data
                  ? verification.preview_data
                  : localLinkPreview.previewData || undefined
              }
              isLoading={false}
              hasAISummary={
                verification.ai_video_summary_status === "COMPLETED" ||
                verification.ai_video_summary_status === "PENDING"
              }
              verificationId={verificationId}
              inFeedView={false}
              factuality={verification.fact_check_data?.factuality}
            />
          )}

          {verification.external_video &&
            verification.ai_video_summary_status === "COMPLETED" && (
              <AISummaryBox
                aiSummary={verification.ai_video_summary}
                videoData={verification.external_video}
                status={verification.ai_video_summary_status}
                style={styles.aiSummaryBox}
              />
            )}
        </View>

        {verification.fact_check_data && (
          <FactCheckBox
            factCheckData={verification.fact_check_data}
            style={styles.factCheckBox}
          />
        )}

        <View style={styles.actionsContainer}>
          <FeedActions verificationId={verificationId} sourceComponent={null} />
        </View>
      </View>
    );
  }
);

PostContent.displayName = "PostContent";

// Main CommentsView Component
const CommentsView = ({
  verification: initialVerification,
  verificationId,
}: {
  verification: LocationFeedPost;
  verificationId: string;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const theme = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const factCheckBottomSheetRef = useRef<BottomSheetModal>(null);

  // Use the same hook to ensure fresh data and consistent caching
  const { data: verificationData } = useVerificationById(verificationId, true, {
    refetchInterval: 5000,
  });

  // Use fresh data if available, otherwise fall back to initial data
  const verification = verificationData || initialVerification;

  const handleMediaPress = useCallback(() => {
    router.replace(`/(tabs)/(home)/verification/${verificationId}`);
  }, [verificationId, router]);

  const [, setActiveSources] = useAtom(activeSourcesState);
  const [, setIsBottomSheetOpen] = useAtom(newsBottomSheetState);
  const handleSourcePress = useCallback(() => {
    if (verification.sources && verification.sources.length > 0) {
      setActiveSources(verification.sources);
      setIsBottomSheetOpen(true);
    }
  }, [verification.sources, setActiveSources, setIsBottomSheetOpen]);

  const keyboardVerticalOffset = useKeyboardVerticalOffset();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NewsSourcesBottomSheet bottomSheetRef={bottomSheetRef} />
      <FactCheckBottomSheet bottomSheetRef={factCheckBottomSheetRef} />
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.container}>
          {/* Header Section */}
          {!verification.title ? (
            <PostHeader
              name={verification.assignee_user?.username || user.username}
              time={verification.last_modified_date}
              avatarUrl={
                verification.assignee_user?.photos[0]?.image_url[0] ||
                user.photos[0]?.image_url[0]
              }
              friendId={verification.assignee_user?.id || user.id}
              headerHeight={headerHeight}
              hasFactCheck={!!verification.fact_check_data}
              isLive={verification.is_live}
            />
          ) : (
            <View
              style={{ paddingTop: headerHeight - 10, position: "relative" }}
            ></View>
          )}

          {verification.title && (
            <TopMetadataSection
              verification={verification}
              onSourcePress={handleSourcePress}
            />
          )}

          <PostContent
            verification={verification}
            verificationId={verificationId}
            handleMediaPress={handleMediaPress}
            user={user}
          />

          <CommentsList postId={verificationId} />
        </View>
      </ScrollView>
      <KeyboardAvoidingView
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior={isIOS ? "padding" : "padding"}
        style={{
          backgroundColor: "transparent",
        }}
      >
        <CommentInput postId={verificationId} />
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
    },
    postContentContainer: {
      marginBottom: 12,
    },
    titleText: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 16,
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    spaceContainer: {
      padding: 12,
    },
    textContentContainer: {
      paddingTop: 0,
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    textContent: {
      color: theme.colors.text,
      fontSize: FontSizes.medium,
      fontWeight: "400",
      letterSpacing: 0.5,
      lineHeight: 24,
      marginBottom: 5,
      opacity: 0.9,
    },
    mediaContainer: {
      position: "relative",
      paddingHorizontal: 8,
      flex: 1,
    },
    actionsContainer: {
      paddingHorizontal: 8,
      marginTop: 8,
    },
    sourcesHorizontalContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    sourcesContainer: {
      paddingHorizontal: 8,
      marginTop: 4,
      marginBottom: 16,
      gap: 4,
    },
    sourcesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    sourcesIconsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sourcesLabel: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    sourcesLabelText: {
      fontSize: 12,
      fontWeight: "600",
    },
    sourceIconRounded: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 4,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    sourceCountText: {
      fontSize: 10,
      fontWeight: "600",
    },
    factCheckBadgePosition: {
      position: "absolute",
      top: -24,
      left: 0,
      zIndex: 10,
    },
    titleContainer: {
      position: "relative",
      marginBottom: 8,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    factCheckBox: {
      marginHorizontal: 6,
      marginVertical: 12,
    },
    dateText: {
      color: "rgb(101, 104, 108)",
      fontSize: 14,
      fontWeight: "500",
      paddingHorizontal: 8,
    },
    aiSummaryBox: {
      marginBottom: 8,
    },
    commentsContainer: {
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    commentsHeaderContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    commentsHeaderText: {
      color: theme.colors.text,
      fontWeight: "500",
      fontSize: 16,
    },
    emptyCommentsContainer: {
      padding: 16,
      alignItems: "center",
    },
    emptyCommentsText: {
      color: "rgb(101, 104, 108)",
      fontSize: 14,
    },
    loadingContainer: {
      padding: 20,
      alignItems: "center",
    },
    errorContainer: {
      padding: 16,
      alignItems: "center",
    },
    errorText: {
      color: "#ef4444",
      fontSize: 14,
    },
    loadMoreIndicator: {
      marginVertical: 16,
    },
    postHeaderFactCheckBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 8,
    },
    topMetadataContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    metadataRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sourcesCompactContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderRadius: 12,
    },
    sourcesCompactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sourceIconsCompactContainer: {
      flexDirection: "row-reverse",
      alignItems: "center",
    },
    sourceIconCompact: {
      marginLeft: 0,
    },
    sourcesCompactLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    factualityWrapper: {
      marginLeft: "auto",
    },
    factualityBadge: {
      borderRadius: 12,
    },
    moreSourcesIndicator: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
      marginRight: -8,
      borderWidth: 1.5,
      zIndex: 4,
    },
    moreSourcesText: {
      fontSize: 10,
      fontWeight: "600",
    },
    sourceIconImage: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
    },
  });

// Use a theme-based stylesheet
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  postContentContainer: {
    marginBottom: 12,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  spaceContainer: {
    padding: 12,
  },
  textContentContainer: {
    paddingHorizontal: 8,
  },
  textContent: {
    fontSize: FontSizes.medium,
    fontWeight: "400",
    letterSpacing: 0.5,
    lineHeight: 24,
    marginBottom: 5,
  },
  mediaContainer: {
    position: "relative",
    paddingHorizontal: 8,
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sourcesHorizontalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourcesContainer: {
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 16,
    gap: 4,
  },
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  sourcesIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourcesLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourcesLabelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sourceIconRounded: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sourceCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
  factCheckBadgePosition: {
    position: "absolute",
    top: -24,
    left: 0,
    zIndex: 10,
  },
  titleContainer: {
    position: "relative",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  factCheckBox: {
    marginHorizontal: 6,
    marginVertical: 12,
  },
  dateText: {
    color: "rgb(101, 104, 108)",
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  aiSummaryBox: {
    marginBottom: 8,
  },
  commentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
  },
  commentsHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentsHeaderText: {
    fontWeight: "500",
    fontSize: 16,
  },
  emptyCommentsContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyCommentsText: {
    color: "rgb(101, 104, 108)",
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
  postHeaderFactCheckBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  topMetadataContainer: {
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  sourcesCompactContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  sourcesCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceIconsCompactContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  sourceIconCompact: {
    marginLeft: 0,
  },
  sourcesCompactLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  factualityWrapper: {
    marginLeft: 10,
  },
  factualityBadge: {
    borderRadius: 12,
  },
  moreSourcesIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -8,
    borderWidth: 1.5,
    zIndex: 4,
  },
  moreSourcesText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sourceIconImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});

export default memo(CommentsView);
