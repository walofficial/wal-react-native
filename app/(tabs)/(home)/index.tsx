import React, { useEffect } from "react";
import { Text } from "@/components/ui/text";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import useLocationsInfo from "@/hooks/useLocationsInfo";
import useGoLive from "@/hooks/useGoLive";
import { FontSizes, useTheme } from "@/lib/theme";
import { isWeb } from "@/lib/platform";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useFeeds from "@/hooks/useFeeds";
import { useUserFeedIds } from "@/hooks/useUserFeedIds";
import { useTranslation } from "@/hooks/useTranslation";

export default function TaskScrollableView() {
  const { t } = useTranslation();
  const { categoryId } = useUserFeedIds();
  const {
    data: data,
    isFetching,
    location,
    errorMsg,
  } = useLocationsInfo(categoryId);
  const { headerHeight } = useFeeds();
  const theme = useTheme();
  const router = useRouter();
  const { goLiveMutation } = useGoLive();
  const insets = useSafeAreaInsets();

  // Auto-navigate to the appropriate task when data is loaded
  useEffect(() => {
    if (!isFetching && data) {
      // First try to navigate to a task at location
      if (data.feeds_at_location && data.feeds_at_location.length > 0) {
        const firstTask = data.feeds_at_location[0];
        router.replace({
          pathname: "/(tabs)/(home)/[feedId]",
          params: {
            feedId: firstTask.id,
          },
        });
        if (!isWeb) {
          goLiveMutation.mutateAsync({
            body: {
              feed_id: firstTask.id,
            },
          });
        }
        return;
      }

      // If no tasks at location, try nearest tasks
      if (data.nearest_feeds && data.nearest_feeds.length > 0) {
        const firstNearTask = data.nearest_feeds[0];
        router.replace({
          pathname: "/(tabs)/(home)/[feedId]",
          params: {
            feedId: firstNearTask.feed.id,
          },
        });
        if (!isWeb && !errorMsg) {
          goLiveMutation.mutateAsync({
            body: {
              feed_id: firstNearTask.feed.id,
            },
          });
        }
        return;
      }
    }
  }, [data, isFetching, router, goLiveMutation, errorMsg]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: headerHeight + insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {isFetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t("common.checking_location")}...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {t("common.location_check_failed_gps_description")}
          </Text>
        </View>
      ) : !data?.feeds_at_location?.length && !data?.nearest_feeds?.length ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {t("common.no_locations_found_description")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 20,
  },
  statusContainer: {
    alignItems: "center",
    maxWidth: 280,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    textAlign: "center",
    fontWeight: "500",
  },
  errorText: {
    fontSize: FontSizes.medium,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
  emptyText: {
    fontSize: FontSizes.medium,
    textAlign: "center",
    fontWeight: "400",
  },
});
