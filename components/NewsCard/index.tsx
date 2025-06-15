import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Linking,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  ViewStyle,
} from "react-native";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Card, CardContent } from "../ui/card";
import { ThemedText } from "../ThemedText";
import * as Haptics from "expo-haptics";
import { FontSizes } from "@/lib/theme";
import CommentButton from "../FeedItem/CommentButton";
import { RectangleHorizontal, Rows2, ChevronRight } from "lucide-react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Layout,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Source } from "@/lib/interfaces";
import { formatRelativeTime } from "@/lib/utils/date";
import { useRouter, usePathname } from "expo-router";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import { useAtom, useAtomValue } from "jotai";
import { shouldFocusCommentInputAtom } from "@/atoms/comments";
import { getFaviconUrl } from "@/utils/urlUtils";
import NewsCardItem from "./NewsCardItem";
import NewsCardSkeleton from "./NewsCardSkeleton";
import { HEADER_HEIGHT } from "@/lib/constants";

// Define the simplified news item interface
export interface NewsItem {
  verification_id: string;
  title: string;
  description?: string; // Add description field
  last_modified_date: string;
  sources?: {
    title: string;
    uri: string;
  }[];
  commentCount?: number; // Optional for backward compatibility
  factuality?: number; // Add the factuality score field
}

interface NewsCardProps {
  newsItems?: NewsItem[];
  isLoading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width
const ITEM_SPACING = 12;

export default React.memo(function NewsCard({
  newsItems = [],
  isLoading,
}: NewsCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { closeLightbox } = useLightboxControls();
  const [_, setShouldFocusInput] = useAtom(shouldFocusCommentInputAtom);
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const scrollViewRef = useRef<ScrollView>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Animation values for container
  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  // Handle scroll event to hide indicator
  const handleScroll = useCallback(() => {
    if (!hasScrolled) {
      setHasScrolled(true);
    }
  }, [hasScrolled]);

  // Memoize the navigation handler to prevent recreation on every render
  const handleNavigateToVerification = useCallback(
    (verificationId: string) => {
      if (!verificationId) return;

      const wasLightboxActive = closeLightbox();

      // Check if we're already on the verification page
      const isOnVerificationPage =
        pathname === `/verification/${verificationId}`;

      if (isOnVerificationPage) {
        setShouldFocusInput(true);
        return;
      }

      // If lightbox was active, wait for animation to complete before navigating
      if (wasLightboxActive) {
        setTimeout(() => {
          router.navigate({
            pathname: "/verification/[verificationId]",
            params: {
              verificationId,
            },
          });
        }, 300);
      } else {
        router.navigate({
          pathname: "/verification/[verificationId]",
          params: {
            verificationId,
          },
        });
      }
    },
    [closeLightbox, pathname, setShouldFocusInput, router]
  );

  // Animated styles for the news container
  const newsContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: containerScale.value }],
      opacity: containerOpacity.value,
    };
  });

  // Render the appropriate content based on loading state
  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.skeletonScrollContainer}
        >
          <NewsCardSkeleton itemCount={3} />
        </ScrollView>
      );
    }

    if (!newsItems.length) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>არ არის ინფორმაცია</ThemedText>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={ITEM_WIDTH + ITEM_SPACING}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.scrollViewContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          disableScrollViewPanResponder={Platform.OS === "ios"}
          bounces={true}
          alwaysBounceHorizontal={true}
          canCancelContentTouches={true}
          directionalLockEnabled={true}
        >
          {newsItems.map((item, index) => (
            <View
              key={item.verification_id}
              style={[
                styles.horizontalItemContainer,
                index === 0 && { marginLeft: ITEM_SPACING },
                index === newsItems.length - 1 && { marginRight: ITEM_SPACING },
              ]}
            >
              <NewsCardItem
                item={item}
                onPress={handleNavigateToVerification}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }, [isLoading, newsItems, handleNavigateToVerification, handleScroll]);

  return (
    <View style={[styles.container, { paddingTop: headerHeight + 40 }]}>
      <Card
        style={{
          backgroundColor: "transparent",
          borderColor: "transparent",
          ...styles.cardShadow,
        }}
      >
        <CardContent style={styles.cardContent}>
          <Reanimated.View
            style={[styles.animatedContainer, newsContainerAnimatedStyle]}
          >
            {renderContent()}
          </Reanimated.View>
        </CardContent>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: "auto",
    width: "100%",
    borderRadius: 12,
    marginTop: 20,
    overflow: "visible",
  },
  cardShadow: {
    ...Platform.select({
      ios: {},
      web: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
      },
    }),
    borderRadius: 12,
    overflow: "hidden",
  },
  feedHeader: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollIndicatorText: {
    fontSize: 14,
    opacity: 0.6,
  },
  cardContent: {
    padding: 0,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingBottom: 16,
  },
  scrollViewContent: {
    paddingVertical: 8,
    gap: ITEM_SPACING,
    ...Platform.select({
      web: {
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollBehavior: "smooth",
      },
    }),
  },
  horizontalItemContainer: {
    width: ITEM_WIDTH,
  },
  skeletonScrollContainer: {
    flexDirection: "row",
    paddingHorizontal: ITEM_SPACING,
  },
  animatedContainer: {
    width: "100%",
    overflow: "hidden",
  },
  singleNewsItem: {
    // Enhanced rectangular appearance with border
    borderWidth: 1,
    borderColor: "rgba(75, 85, 99, 0.3)",
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
  },
  singleNewsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  pressableItem: {
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.2s ease",
      },
      default: {
        // Android and iOS will use the native feedback
      },
    }),
  },
  pressablePressed: {
    opacity: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    transform: [{ scale: 0.98 }],
  },
});
