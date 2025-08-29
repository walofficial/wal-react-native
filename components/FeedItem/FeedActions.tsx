import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Text,
  Animated,
  Pressable,
  TouchableOpacity,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import CommentButton from "./CommentButton";
import ShareButton from "./ShareButton";
import { useTheme } from "@/lib/theme";
import { useRouter, usePathname } from "expo-router";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import FactualityBadge from "../ui/FactualityBadge";
import { toast } from "@backpackapp-io/react-native-toast";
import useVerificationById from "@/hooks/useVerificationById";
import { getFactCheckBadgeInfo } from "@/utils/factualityUtils";
import { t } from "@/lib/i18n";

interface FeedActionsProps {
  verificationId: string;
  sourceComponent?: React.ReactNode;
  hideUserRects?: boolean;
  showFactualityBadge?: boolean;
  isOwner: boolean;
}

// Animated loading circle component
const LoadingCircle = ({
  color,
  size = 16,
}: {
  color: string;
  size?: number;
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false, // SVG animations need useNativeDriver: false
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const radius = size / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * 0.75; // Show 25% of the circle

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
        />
      </Svg>
    </Animated.View>
  );
};

// Factuality loader component with pulsing effect
const FactualityLoader = ({ style }: { style?: any }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const handlePress = () => {
    toast(t("common.post_checking_time"), {
      duration: 3000,
      id: "factuality-loader",
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: isDarkColorScheme
              ? "rgba(60, 60, 60, 0.3)"
              : "rgba(240, 240, 240, 0.5)",
            // Opacity will be controlled by the parent component via the style prop
          },
          style,
        ]}
      >
        <LoadingCircle color="#34C759" size={16} />
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          {t("common.fact_check_loading")}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// Summary loader component
const SummaryLoader = ({ style }: { style?: any }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const handlePress = () => {
    toast(t("common.text_analysis_in_progress"), {
      duration: 3000,
      id: "summary-loader",
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: isDarkColorScheme
              ? "rgba(60, 60, 60, 0.3)"
              : "rgba(240, 240, 240, 0.5)",
          },
          style,
        ]}
      >
        <LoadingCircle color="#007AFF" size={16} />
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          {t("common.analyzing_post")}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// Metadata loader component
const MetadataLoader = ({ style }: { style?: any }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const handlePress = () => {
    toast(t("common.please_wait"), {
      duration: 3000,
      id: "metadata-loader",
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: isDarkColorScheme
              ? "rgba(60, 60, 60, 0.3)"
              : "rgba(240, 240, 240, 0.5)",
          },
          style,
        ]}
      >
        <LoadingCircle color="#34C759" size={16} />
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          {t("common.analyzing_post")}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const FeedActions: React.FC<FeedActionsProps> = ({
  hideUserRects,
  verificationId,
  sourceComponent,
  showFactualityBadge,
  isOwner,
}) => {
  // Use the same hook as CommentsView to ensure consistent data
  const { data: verification } = useVerificationById(verificationId, isOwner, {
    refetchInterval: 5000, // Same interval as CommentsView uses
  });
  // Extract the data from verification object
  const factuality = verification?.fact_check_data?.factuality;
  const isFactualityLoading = verification?.fact_check_status === "PENDING";
  const isSummaryLoading = verification?.ai_video_summary_status === "PENDING";
  const metadataLoading = verification?.metadata_status === "PENDING";

  const loaderOpacity = useRef(
    new Animated.Value(isFactualityLoading ? 1 : 0)
  ).current;
  const badgeOpacity = useRef(
    new Animated.Value(isFactualityLoading ? 0 : 1)
  ).current;
  const summaryLoaderOpacity = useRef(
    new Animated.Value(isSummaryLoading ? 1 : 0)
  ).current;
  const metadataLoaderOpacity = useRef(
    new Animated.Value(metadataLoading ? 1 : 0)
  ).current;
  const router = useRouter();
  const pathname = usePathname();
  const { closeLightbox } = useLightboxControls();

  const badgeInfo = getFactCheckBadgeInfo(factuality);

  useEffect(() => {
    if (isFactualityLoading) {
      // Show loader, hide badge
      Animated.parallel([
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (badgeInfo) {
      // Show badge, hide loader
      Animated.parallel([
        Animated.timing(loaderOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFactualityLoading, badgeInfo]);

  // Handle summary loading animation
  useEffect(() => {
    Animated.timing(summaryLoaderOpacity, {
      toValue: isSummaryLoading ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSummaryLoading]);

  // Handle metadata loading animation
  useEffect(() => {
    Animated.timing(metadataLoaderOpacity, {
      toValue: metadataLoading ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [metadataLoading]);

  const handleFactualityPress = () => {
    const wasLightboxActive = closeLightbox();

    // Check if we're already on the verification page
    const isOnVerificationPage = pathname === `/verification/${verificationId}`;

    if (isOnVerificationPage) {
      // Potentially scroll to a relevant section or do nothing
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
  };

  return (
    <View style={styles.container}>
      <View style={[styles.actionsCard]}>
        <View style={styles.actionsWrapper}>
          <View style={styles.actionGroup}>
            {/* {!hideUserRects && <LikeButton verificationId={verificationId} />} */}
            {!hideUserRects && (
              <CommentButton
                // style={{ marginLeft: 12 }}
                large
                verificationId={verificationId}
              />
            )}
            <Pressable
              onPress={handleFactualityPress}
              style={[
                styles.factualityContainer,
                { marginLeft: hideUserRects ? 0 : 12 },
              ]}
            >
              {badgeInfo &&
                showFactualityBadge &&
                !isFactualityLoading &&
                !isSummaryLoading &&
                !metadataLoading && (
                  <FactualityBadge
                    text={badgeInfo.text}
                    type={badgeInfo.type}
                  />
                )}
              {isFactualityLoading && (
                <FactualityLoader
                  style={{
                    opacity: loaderOpacity,
                  }}
                />
              )}
              {!isFactualityLoading && isSummaryLoading && (
                <SummaryLoader
                  style={{
                    opacity: summaryLoaderOpacity,
                  }}
                />
              )}
              {!isFactualityLoading && !isSummaryLoading && metadataLoading && (
                <MetadataLoader
                  style={{
                    opacity: metadataLoaderOpacity,
                  }}
                />
              )}
            </Pressable>
          </View>
          <View style={styles.actionGroup}>
            <ShareButton verificationId={verificationId} />
          </View>
        </View>
      </View>
      {sourceComponent && (
        <View style={styles.sourceComponentContainer}>{sourceComponent}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  actionsCard: {
    borderRadius: 10,
    paddingVertical: 6,
  },
  actionsWrapper: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceComponentContainer: {
    marginTop: 10,
    width: "100%",
  },
  // Factuality loader styles
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "500",
  },
  factualityContainer: {
    marginLeft: 12,
    height: 28,
    maxWidth: 200,
    justifyContent: "center",
    alignItems: "flex-start",
  },
});

export default FeedActions;
