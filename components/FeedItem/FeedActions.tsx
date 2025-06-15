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
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import ImpressionsCount from "./ImpressionsCount";
import ShareButton from "./ShareButton";
import { useTheme } from "@/lib/theme";
import { useRouter, usePathname } from "expo-router";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import FactualityBadge from "../ui/FactualityBadge";
import { toast } from "@backpackapp-io/react-native-toast";
import useVerificationById from "@/hooks/useVerificationById";

interface FeedActionsProps {
  verificationId: string;
  sourceComponent?: React.ReactNode;
  hideUserRects?: boolean;
}

// Factuality loader component with pulsing effect
const FactualityLoader = ({ style }: { style?: any }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === "dark";

  const handlePress = () => {
    toast("ფოსტის შემოწმებას უნდა 5 დან 10 წუთამდე", {
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
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          მოწმდება...
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
    toast("ტექსტის ანალიზი მიმდინარეობს", {
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
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          ვაანალიზებთ...
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
    toast("მეტადატას ვამოწმებთ", {
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
        <Text style={[styles.loaderText, { color: theme.colors.text }]}>
          გადავამოწმებთ...
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const FeedActions: React.FC<FeedActionsProps> = ({
  hideUserRects,
  verificationId,
  sourceComponent,
}) => {
  // Use the same hook as CommentsView to ensure consistent data
  const { data: verification } = useVerificationById(verificationId, true, {
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
      console.log("isOnVerificationPage", isOnVerificationPage);
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
              {/* {badgeInfo &&
                !isFactualityLoading &&
                !isSummaryLoading &&
                !metadataLoading && (
                  <FactualityBadge
                    text={badgeInfo.text}
                    type={badgeInfo.type}
                  />
                )} */}
              {isFactualityLoading && (
                <FactualityLoader
                  style={{
                    opacity: loaderOpacity,
                  }}
                />
              )}
              {!isFactualityLoading && isSummaryLoading && <SummaryLoader />}
              {!isFactualityLoading && !isSummaryLoading && metadataLoading && (
                <MetadataLoader />
              )}
            </Pressable>
          </View>
          <View style={styles.actionGroup}>
            {/* <ImpressionsCount verificationId={verificationId} /> */}
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
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "500",
  },
  factualityContainer: {
    marginLeft: 12,
    height: 28,
    width: 150,
    justifyContent: "center",
    alignItems: "flex-start",
  },
});

export default FeedActions;
