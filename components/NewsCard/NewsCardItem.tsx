import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { ChevronRight } from "lucide-react-native";
import { ThemedText } from "../ThemedText";
import { formatRelativeTime } from "@/lib/utils/date";
import { getFaviconUrl } from "@/utils/urlUtils";
import { NewsItem } from "./index";
import * as Haptics from "expo-haptics";
import { differenceInHours, parseISO } from "date-fns";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "react-native";
import FactualityBadge, { FactualityBadgeType } from "../ui/FactualityBadge";

const MAX_SOURCES = 5;

// Helper function to get unique favicon URLs from sources
const getUniqueSourceIcons = (sources?: NewsItem["sources"]) => {
  if (!sources || sources.length === 0) return [];

  const uniqueUrls = new Map();

  sources.forEach((source) => {
    if (source.uri) {
      const faviconUrl = getFaviconUrl(source.uri);
      if (!uniqueUrls.has(faviconUrl)) {
        uniqueUrls.set(faviconUrl, source);
      }
    }
  });

  return Array.from(uniqueUrls.values());
};

interface NewsCardItemProps {
  item: NewsItem;
  onPress: (verificationId: string) => void;
}

const NewsCardItem: React.FC<NewsCardItemProps> = ({ item, onPress }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme() || "dark";
  const isDark = colorScheme === "dark";

  // Memoize the press handler to prevent recreation on every render
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(item.verification_id);
  }, [onPress, item.verification_id]);

  // Memoize the timestamp opacity calculation
  const timestampOpacity = useMemo(() => {
    try {
      const itemDate = parseISO(item.last_modified_date);
      const hoursDiff = differenceInHours(new Date(), itemDate);

      if (hoursDiff < 1) {
        return 1;
      } else if (hoursDiff < 6) {
        return 0.9;
      } else if (hoursDiff < 24) {
        return 0.8;
      }
      return 0.7;
    } catch (error) {
      console.error("Error parsing date:", error);
      return 0.7;
    }
  }, [item.last_modified_date]);

  // Memoize the fact check badge info calculation
  const badgeInfo = useMemo((): {
    text: string;
    type: "truth" | "misleading" | "neutral";
  } | null => {
    const score = item.factuality;

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
  }, [item.factuality]);

  // Memoize the shared badge type
  const sharedBadgeType: FactualityBadgeType | undefined = useMemo(() => {
    if (!badgeInfo) return undefined;

    if (badgeInfo.type === "neutral") {
      return "needs-context";
    } else {
      return badgeInfo.type as FactualityBadgeType; // "truth" or "misleading"
    }
  }, [badgeInfo]);

  // Memoize the unique source icons to prevent recalculation
  const uniqueSourceIcons = useMemo(() => {
    return getUniqueSourceIcons(item.sources);
  }, [item.sources]);
  return (
    <Pressable
      onPress={handlePress}
      style={styles.pressableItem}
      accessibilityRole="button"
      accessibilityLabel={`News item: ${item.title}`}
      accessibilityHint="Double tap to read full story"
    >
      <View
        style={[
          styles.newsItem,
          {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderColor: isDark
              ? theme.colors.border
              : "rgba(230, 230, 230, 0.8)",
            ...Platform.select({
              ios: {
                shadowColor: isDark ? "#000" : "#e0e0e0",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.25 : 0.05,
                shadowRadius: isDark ? 3 : 1,
              },
              android: {
                elevation: isDark ? 3 : 0.5,
              },
            }),
          },
        ]}
      >
        <View style={styles.newsContent}>
          <View style={styles.newsContentHeader}>
            <View style={styles.newsTextContainer}>
              <ThemedText numberOfLines={4} style={[styles.newsText]}>
                {item.title}
              </ThemedText>
            </View>
          </View>
          <View style={styles.newsFooter}>
            <View style={styles.footerLeftSection}>
              <ThemedText
                style={[styles.timestampText, { opacity: timestampOpacity }]}
              >
                {formatRelativeTime(item.last_modified_date)}
              </ThemedText>
              <View style={styles.badgeAndSourcesRow}>
                {badgeInfo && sharedBadgeType && (
                  <View style={styles.badgeWrapper}>
                    <FactualityBadge
                      text={badgeInfo.text}
                      type={sharedBadgeType}
                      style={[
                        styles.newsCardBadgeStyles,
                        Platform.OS === "ios" && styles.iosBadgeShadow,
                      ]}
                    />
                  </View>
                )}
                <View style={styles.sourceIconsContainer}>
                  {item.sources &&
                    uniqueSourceIcons
                      .slice(0, MAX_SOURCES)
                      .map((source, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.sourceIcon,
                            {
                              marginLeft: idx > 0 ? -8 : 0,
                              zIndex: 3 - idx,
                            },
                          ]}
                        >
                          {source.uri && (
                            <Image
                              transition={300}
                              source={{ uri: getFaviconUrl(source.uri) }}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                borderWidth: 1.5,
                                borderColor: theme.colors.card.background,
                              }}
                            />
                          )}
                        </View>
                      ))}
                  {item.sources && uniqueSourceIcons.length > MAX_SOURCES && (
                    <View
                      style={[
                        styles.moreSourcesIndicator,
                        {
                          backgroundColor: isDark ? "#e0e0e0" : "#808080",
                          borderColor: theme.colors.card.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.moreSourcesText,
                          { color: isDark ? "#333333" : "#ffffff" },
                        ]}
                      >
                        +{uniqueSourceIcons.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.footerRightSection}>
              <ChevronRight
                size={16}
                color={theme.colors.text}
                style={styles.navIcon}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableItem: {
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      },
      default: {
        // Android and iOS will use the native feedback
      },
    }),
  },
  pressedState: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  newsItem: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 16,
    minHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
  },
  lastNewsItem: {
    marginBottom: 12,
  },
  sourceIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceIcon: {
    marginLeft: 0,
  },
  newsContent: {
    flex: 1,
    justifyContent: "space-between",
    display: "flex",
    flexDirection: "column",
  },
  newsContentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    overflow: "hidden",
  },
  newsTextContainer: {
    flex: 1,
    overflow: "hidden",
  },
  newsText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },
  newsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  footerLeftSection: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    gap: 6,
  },
  footerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  navIcon: {
    marginLeft: 0,
  },
  timestampText: {
    fontSize: 12,
  },
  singleNewsItem: {
    borderWidth: 1,
    borderRadius: 8,
  },
  singleNewsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  newsCardBadgeStyles: {
    borderRadius: 12,
  },
  iosBadgeShadow: {
    shadowColor: "#00000040",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  badgeWrapper: {
    marginLeft: 0,
  },
  moreSourcesIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
    borderWidth: 1.5,
    zIndex: 4,
  },
  moreSourcesText: {
    fontSize: 10,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.7,
  },
  badgeAndSourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
});

export default React.memo(NewsCardItem, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.item.verification_id === nextProps.item.verification_id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.last_modified_date === nextProps.item.last_modified_date &&
    prevProps.item.factuality === nextProps.item.factuality &&
    prevProps.onPress === nextProps.onPress
  );
});
