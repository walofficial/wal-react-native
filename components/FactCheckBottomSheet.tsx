// @ts-nocheck
import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  BackHandler,
  useColorScheme,
} from "react-native";
import { BlurView } from "expo-blur";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackgroundProps,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useAtom } from "jotai";
import {
  activeFactCheckData,
  factCheckBottomSheetState,
} from "@/lib/atoms/news";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SourceIcon from "./SourceIcon";
import { router, useGlobalSearchParams } from "expo-router";
import { isAndroid } from "@/lib/platform";
import { FactCheckRating } from "./FactCheckRating";
import { User } from "@/lib/api/generated";
import { NativeEventSubscription } from "react-native";
import { useTheme } from "@/lib/theme";
import { Portal } from "@gorhom/portal";
import RenderMdx from "./RenderMdx";
import { t } from "@/lib/i18n";
interface FactCheckBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  verificationData?: LocationFeedPost;
}

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({ style }) => {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          style,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(255, 255, 255, 0.65)",
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(20, 20, 20, 1)"
              : "rgba(242, 242, 247, 1)",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
      ]}
    />
  );
};

// Add these constants at the top level
const STATUS_COLORS = {
  VERIFIED: "#10b981", // More saturated green
  NEEDS_CONTEXT: "#1877F2", // Blue
  MISLEADING: "#ff6666", // Light red
  FALSE_HARMFUL: "#FF0000", // Red
};

export default function FactCheckBottomSheet({
  bottomSheetRef,
}: FactCheckBottomSheetProps) {
  const { verificationId } = useGlobalSearchParams<{
    verificationId: string;
  }>();
  const theme = useTheme();

  const [factCheckData, setFactCheckData] = useAtom(activeFactCheckData);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useAtom(
    factCheckBottomSheetState
  );
  const snapPoints = React.useMemo(() => ["70%"], []);
  const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
    null
  );

  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setFactCheckData(null);
    }
  }, [isBottomSheetOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setIsBottomSheetOpen(false);
  };
  const insets = useSafeAreaInsets();

  // Calculate support counts
  const getSupportCounts = (references: any[] = []) => {
    const supportive = references.filter((ref) => ref.is_supportive).length;
    const contradictory = references.filter((ref) => !ref.is_supportive).length;
    return { supportive, contradictory };
  };

  const handleInfoPress = () => {
    handleClose();
    router.push({
      pathname: "/fact-checks",
    });
  };

  const handleSheetPositionChange = useCallback(
    (index: number) => {
      const isBottomSheetVisible = index >= 0;

      // Handle back button
      if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
        backHandlerSubscriptionRef.current = BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            bottomSheetRef.current?.close();
            return true;
          }
        );
      } else if (!isBottomSheetVisible) {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      }

      // Handle state management
      setIsBottomSheetOpen(isBottomSheetVisible);
      if (!isBottomSheetVisible) {
        setFactCheckData(null);
      }
    },
    [bottomSheetRef, setIsBottomSheetOpen, setFactCheckData]
  );

  const handleRate = (isHelpful: boolean) => {
    // Mock function for now - will be replaced with actual API call
    console.log(
      `User rated fact check as ${isHelpful ? "helpful" : "not helpful"}`
    );
  };

  // Add this helper function
  const getScoreColor = (score: number) => {
    if (score >= 0.75) return STATUS_COLORS.VERIFIED;
    if (score >= 0.5) return STATUS_COLORS.NEEDS_CONTEXT;
    if (score >= 0.25) return STATUS_COLORS.MISLEADING;
    return STATUS_COLORS.FALSE_HARMFUL;
  };

  return (
    <Portal name="fact-check-bottom-sheet">
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        topInset={insets.top + (isAndroid ? 50 : 0)}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundComponent={CustomBackground}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text }}
        onClose={handleClose}
        onChange={handleSheetPositionChange}
        animateOnMount
        enableContentPanningGesture
      >
        <BottomSheetScrollView style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t("common.fact_check")}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={handleInfoPress}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
          </View>
          {factCheckData && (
            <>
              <View style={styles.scoreSection}>
                <View style={styles.percentageContainer}>
                  <Text
                    style={[
                      styles.percentageText,
                      { color: getScoreColor(factCheckData.factuality ?? 0) },
                    ]}
                  >
                    {(factCheckData.factuality ?? 0) >= 0.5
                      ? `${Math.round(
                          (factCheckData.factuality ?? 0) * 100
                        )}% ${t("common.truth")}`
                      : `${Math.round(
                          100 - (factCheckData.factuality ?? 0) * 100
                        )}% ${t("common.falsehood")}`}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <RenderMdx
                  content={factCheckData.reason || "No explanation provided"}
                />
              </View>

              {factCheckData.references &&
                factCheckData.references.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sourcesHeader}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.feedItem.secondaryText },
                        ]}
                      >
                        წყაროები
                      </Text>
                      <View style={styles.supportStats}>
                        {(() => {
                          const counts = getSupportCounts(
                            factCheckData.references
                          );
                          return (
                            <>
                              <View
                                style={[
                                  styles.statBadge,
                                  {
                                    backgroundColor: "rgba(34, 197, 94, 0.15)",
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color="#22c55e"
                                />
                                <Text
                                  style={[
                                    styles.statText,
                                    { color: "#22c55e" },
                                  ]}
                                >
                                  {counts.supportive} ადასტურებს
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.statBadge,
                                  {
                                    backgroundColor:
                                      counts.contradictory > 0
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : "rgba(107, 114, 128, 0.15)",
                                  },
                                ]}
                              >
                                <Ionicons
                                  name={
                                    counts.contradictory > 0
                                      ? "close-circle"
                                      : "information-circle"
                                  }
                                  size={18}
                                  color={
                                    counts.contradictory > 0
                                      ? "#ef4444"
                                      : "#6b7280"
                                  }
                                />
                                <Text
                                  style={[
                                    styles.statText,
                                    {
                                      color:
                                        counts.contradictory > 0
                                          ? "#ef4444"
                                          : "#6b7280",
                                    },
                                  ]}
                                >
                                  {counts.contradictory > 0
                                    ? `${counts.contradictory} უარყოფს`
                                    : "არავინ უარყოფს"}
                                </Text>
                              </View>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                    {factCheckData.references.map((ref, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.referenceItem,
                          {
                            backgroundColor: theme.colors.card.background,
                            borderLeftColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => ref.url && Linking.openURL(ref.url)}
                      >
                        <Text
                          style={[
                            styles.quoteText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {ref.key_quote || ref.source_title}
                        </Text>
                        <View
                          style={[
                            styles.supportBadge,
                            { borderTopColor: theme.colors.border },
                          ]}
                        >
                          <View style={styles.supportInfo}>
                            <SourceIcon sourceUrl={ref.url} size={16} />
                            <Text
                              style={[
                                styles.supportText,
                                {
                                  color: ref.is_supportive
                                    ? "#22c55e"
                                    : "#ef4444",
                                },
                              ]}
                            >
                              {ref.is_supportive ? "ადასტურებს" : "უარყოფს"}
                            </Text>
                          </View>
                          <Ionicons
                            name="arrow-forward-outline"
                            size={16}
                            color={theme.colors.secondary}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
            </>
          )}
        </BottomSheetScrollView>
        {factCheckData && verificationId && (
          <FactCheckRating verificationId={verificationId} />
        )}
      </BottomSheet>
    </Portal>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  percentageContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  percentageText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sourcesHeader: {
    marginBottom: 20,
  },
  supportStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  statBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  reasonText: {
    fontSize: 16,
    lineHeight: 24,
  },
  referenceItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    position: "relative",
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: "400",
    fontStyle: "italic",
  },
  supportBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
  },
  supportInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  supportText: {
    fontSize: 13,
    fontWeight: "600",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  infoButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
