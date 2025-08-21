import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  ActivityIndicator,
  DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SourceIcon from "./SourceIcon";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontSizes } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useSetAtom } from "jotai";
import { aiSummaryBottomSheetState } from "@/lib/atoms/news";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { convertToCDNUrl } from "@/lib/utils";
import FactualityBadge from "./ui/FactualityBadge";
import { getFactCheckBadgeInfo } from "@/utils/factualityUtils";
import { LinkPreviewData } from "@/lib/api/generated";

interface LinkPreviewProps {
  previewData: LinkPreviewData;
  isLoading?: boolean;
  hasAISummary?: boolean;
  inFeedView?: boolean;
  onInvalidLinkChange?: (isInvalid: boolean) => void;
  verificationId?: string;
  metadataLoading?: boolean;
  factuality?: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
// Assume parent FeedItem has paddingHorizontal: 8 on each side
const PARENT_HORIZONTAL_PADDING = 8 * 2;
const EFFECTIVE_WIDTH = SCREEN_WIDTH - PARENT_HORIZONTAL_PADDING;
const CARD_HEIGHT_16_9 = EFFECTIVE_WIDTH * (9 / 16); // Strict 16:9 based on effective width

export default function LinkPreview({
  previewData,
  isLoading = false,
  hasAISummary = false,
  inFeedView = false,
  onInvalidLinkChange,
  verificationId,
  metadataLoading = false,
  factuality,
}: LinkPreviewProps) {
  const { feedId } = useLocalSearchParams();
  const router = useRouter();
  const [isInvalidLink, setIsInvalidLink] = useState(false);

  const cardBackgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secondaryTextColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "background");

  const badgeInfo = getFactCheckBadgeInfo(factuality);

  // Calculate container height based on props
  let containerHeight: DimensionValue;

  if (!previewData?.images || previewData.images.length === 0) {
    // Use auto height for text-only previews
    containerHeight = "auto";
  } else {
    // Default to strict 16:9 for other cases with images (e.g., regular feed view)
    containerHeight = CARD_HEIGHT_16_9;
  }

  // General invalid link checker
  const isLinkInvalid = (url: string): boolean => {
    if (!url || typeof url !== "string") return true;

    try {
      const urlObj = new URL(url);

      // Check for malformed URLs
      if (!urlObj.protocol || !urlObj.hostname) return true;

      // Check for suspicious or problematic patterns
      const problematicPatterns = [
        /story_fbid/, // Facebook story URLs that don't work well
        /\/share\/\?/, // Generic share URLs without proper content
        /javascript:/i, // JavaScript URLs
        /data:/i, // Data URLs
        /file:/i, // File URLs
        /^https?:\/\/[^\/]+$/, // URLs with no path (just domain)
        /bit\.ly.*\/[a-zA-Z0-9]{1,5}$/, // Very short bitly URLs (often spam)
        /tinyurl\.com.*\/[a-zA-Z0-9]{1,6}$/, // Very short tinyurl URLs
        /[^\x00-\x7F]/, // Non-ASCII characters in URL (potential encoding issues)
      ];

      // Check hostname patterns that are often problematic
      const problematicDomains = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "example.com",
        "test.com",
        "placeholder.com",
      ];

      // Check for problematic patterns
      if (problematicPatterns.some((pattern) => pattern.test(url))) {
        return true;
      }

      // Check for problematic domains
      if (
        problematicDomains.some((domain) => urlObj.hostname.includes(domain))
      ) {
        return true;
      }

      // Check for URLs that are too short (likely incomplete)
      if (url.length < 10) return true;

      // Check for missing TLD
      if (!urlObj.hostname.includes(".")) return true;

      return false;
    } catch (error) {
      // If URL parsing fails, consider it invalid
      return true;
    }
  };

  useEffect(() => {
    const isInvalid = previewData?.url ? isLinkInvalid(previewData.url) : false;
    setIsInvalidLink(isInvalid);

    // Notify parent component about invalid link state
    if (onInvalidLinkChange) {
      onInvalidLinkChange(isInvalid);
    }
  }, [previewData?.url, onInvalidLinkChange]);

  const handlePress = () => {
    if (inFeedView && verificationId) {
      // In feed view, navigate to verification page when clicked
      router.navigate({
        pathname: "/verification/[verificationId]",
        params: {
          verificationId,
          feedId,
        },
      });
    } else if (previewData?.url) {
      // In comments view, open the external link when clicked
      Linking.openURL(previewData.url);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: cardBackgroundColor,
            height: containerHeight, // Use calculated height
          },
          // Apply textOnlyContainer style only if needed for other styles
          containerHeight === "auto" ? styles.textOnlyContainer : null,
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.content, { backgroundColor: cardBackgroundColor }]}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.image,
              styles.loadingDark,
              { backgroundColor: borderColor },
            ]}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          />
          <View style={styles.loadingTitleContainer}>
            <View
              style={[
                styles.loadingTitle,
                styles.loadingDark,
                { backgroundColor: borderColor },
              ]}
            />
            <View
              style={[
                styles.loadingTitle,
                styles.loadingDark,
                { width: "60%", marginTop: 8, backgroundColor: borderColor },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (metadataLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.textOnlyContainer,
          {
            backgroundColor: cardBackgroundColor,
            height: "auto",
          },
        ]}
      >
        <View
          style={[
            styles.textOnlyContent,
            { backgroundColor: cardBackgroundColor },
          ]}
        >
          <View style={styles.metadataLoadingContainer}>
            <ActivityIndicator size="small" color={textColor} />
            <Text style={[styles.metadataLoadingText, { color: textColor }]}>
              გადავამოწმებთ...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!previewData) return null;

  // Render invalid link state
  if (isInvalidLink) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: cardBackgroundColor,
            height: containerHeight, // Use calculated height
          },
          containerHeight === "auto" ? styles.textOnlyContainer : null,
        ]}
      >
        <View
          style={[styles.content, { backgroundColor: cardBackgroundColor }]}
        >
          <View
            style={[
              styles.image,
              styles.invalidLinkBackground,
              { backgroundColor: borderColor },
            ]}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          />
          <View style={styles.contentOverlay}>
            <View style={styles.titleContainer}>
              <View style={styles.textBackground}>
                <View style={styles.headerRow}>
                  <Text style={styles.invalidLinkTitle}>არავალიდური ლინკი</Text>
                  {previewData.url && (
                    <View style={styles.iconContainer}>
                      <SourceIcon sourceUrl={previewData.url} size={20} />
                    </View>
                  )}
                </View>
                <Text style={styles.invalidLinkDescription}>
                  ლინკი არავალიდურია ან ვერ ტვირთავს ლინკის გადახედვას
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBackgroundColor,
          height: containerHeight, // Use calculated height
        },
        containerHeight === "auto" ? styles.textOnlyContainer : null,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.content, { backgroundColor: cardBackgroundColor }]}
        activeOpacity={0.9}
      >
        {previewData.images && previewData.images.length > 0 ? (
          <>
            <Image
              source={{ uri: convertToCDNUrl(previewData.images[0]) }}
              style={styles.image}
              transition={100}
            />

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.gradient}
            />

            <View style={styles.contentOverlay}>
              {previewData.title && (
                <View style={styles.titleContainer}>
                  <View style={styles.textBackground}>
                    <View style={styles.headerRow}>
                      <Text style={styles.title} numberOfLines={2}>
                        {previewData.title}
                      </Text>
                      {previewData.url && (
                        <View style={styles.iconContainer}>
                          <SourceIcon sourceUrl={previewData.url} size={20} />
                        </View>
                      )}
                    </View>

                    {previewData.description && (
                      <Text style={styles.description} numberOfLines={2}>
                        {previewData.description.replace(/\n/g, " ")}
                      </Text>
                    )}

                    <View style={styles.badgeContainer}>
                      {badgeInfo?.text && (
                        <FactualityBadge
                          text={badgeInfo?.text || ""}
                          type={badgeInfo?.type || "needs-context"}
                          style={styles.factualityBadge}
                        />
                      )}
                      {hasAISummary && (
                        <View style={styles.aiSummaryBadge}>
                          <Ionicons
                            name="sparkles"
                            size={14}
                            color="rgba(255, 255, 255, 0.9)"
                          />
                          <Text
                            style={[
                              styles.aiSummaryText,
                              { color: "rgba(255, 255, 255, 0.95)" },
                            ]}
                          >
                            ანალიზი
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </>
        ) : (
          // Text-only layout when no images are available
          <View style={styles.textOnlyContent}>
            <View style={styles.textOnlyHeader}>
              <View style={[styles.badgeContainer]}>
                {badgeInfo && (
                  <FactualityBadge
                    text={badgeInfo.text}
                    type={badgeInfo.type}
                    style={styles.factualityBadge}
                  />
                )}
                {hasAISummary && (
                  <View
                    style={[
                      styles.aiSummaryBadge,
                      styles.textOnlyAISummaryBadge,
                    ]}
                  >
                    <Ionicons name="sparkles" size={12} color={textColor} />
                    <Text
                      style={[
                        styles.aiSummaryText,
                        { fontSize: 12, color: textColor },
                      ]}
                    >
                      ანალიზი
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {previewData.title && (
              <Text
                style={[styles.textOnlyTitle, { color: textColor }]}
                numberOfLines={3}
              >
                {previewData.title}
              </Text>
            )}

            {previewData.description && (
              <Text
                style={[
                  styles.textOnlyDescription,
                  { color: secondaryTextColor },
                ]}
                numberOfLines={3}
              >
                {previewData.description.replace(/\n/g, " ")}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  textOnlyContainer: {
    height: "auto",
    minHeight: 120,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  textOnlyContent: {
    padding: 16,
    flex: 1,
  },
  textOnlyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  siteName: {
    color: "#888",
    fontSize: 12,
    marginLeft: 8,
  },
  textOnlyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textOnlyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  titleContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  textBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 18,
    marginBottom: 10,
  },
  analysisBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  aiSummaryText: {
    color: "#fff",
    fontSize: FontSizes.small,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  // Loading state styles
  loadingTitleContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  loadingContent: {
    padding: 16,
    justifyContent: "center",
  },
  loadingBackground: {
    backgroundColor: "#1A1A1A",
  },
  loadingDark: {
    backgroundColor: "rgba(60, 60, 60, 0.5)",
    borderRadius: 4,
  },
  loadingTitle: {
    height: 18,
    width: "90%",
    borderRadius: 4,
  },
  invalidLinkBackground: {
    backgroundColor: "#2A2A2A",
  },
  invalidLinkTitle: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  invalidLinkDescription: {
    color: "#f0f0f0",
    fontSize: 13,
    fontWeight: "400",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 18,
    marginBottom: 10,
  },
  metadataLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  metadataLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  factualityBadgeOverlay: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  factualityBadge: {
    alignSelf: "flex-start",
  },
  textOnlyBadge: {
    marginLeft: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  aiSummaryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    height: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    boxShadow: "0px 4px 10px 0px rgba(0, 0, 0, 0.1)",
  },
  textOnlyAISummaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.08)",
  },
  linkPreviewBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  customFactualityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.5)",
  },
  customBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: -0.24,
  },
});
