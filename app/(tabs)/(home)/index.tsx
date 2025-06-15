import React, { useEffect } from "react";
import { Text } from "@/components/ui/text";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import useLocationsInfo from "@/hooks/useLocationsInfo";
import useGoLive from "@/hooks/useGoLive";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import { FontSizes, useTheme } from "@/lib/theme";
import { isWeb } from "@/lib/platform";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TaskScrollableView() {
  const {
    data: data,
    isFetching,
    location,
    errorMsg,
  } = useLocationsInfo("669e9a03dd31644abb767337");

  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const theme = useTheme();
  const router = useRouter();
  const { goLiveMutation } = useGoLive();
  const insets = useSafeAreaInsets();

  // Auto-navigate to the appropriate task when data is loaded
  useEffect(() => {
    if (!isFetching && data) {
      // First try to navigate to a task at location
      if (data.tasks_at_location && data.tasks_at_location.length > 0) {
        const firstTask = data.tasks_at_location[0];
        router.replace({
          pathname: "/(tabs)/(home)/[taskId]",
          params: {
            taskId: firstTask.id,
          },
        });
        if (!isWeb) {
          goLiveMutation.mutateAsync(firstTask.id);
        }
        return;
      }

      // If no tasks at location, try nearest tasks
      if (data.nearest_tasks && data.nearest_tasks.length > 0) {
        const firstNearTask = data.nearest_tasks[0];
        router.replace({
          pathname: "/(tabs)/(home)/[taskId]",
          params: {
            taskId: firstNearTask.task.id,
          },
        });
        if (!isWeb && !errorMsg) {
          goLiveMutation.mutateAsync(firstNearTask.task.id);
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
            ვამოწმებთ ლოკაციას...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            სამწუხაროდ ლოკაციის შემოწმება ვერ მოხერხდა. გადაამოწმეთ GPS
            პარამეტრები
          </Text>
        </View>
      ) : !data?.tasks_at_location?.length && !data?.nearest_tasks?.length ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            ლოკაციები ვერ მოიძებნა
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
