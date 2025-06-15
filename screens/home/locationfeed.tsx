import React, { Suspense, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LocationFeed from "@/components/LocationFeed";
import { useAtom } from "jotai";
import { activeLivekitRoomState } from "@/components/SpacesBottomSheet/atom";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNotifications } from "@/components/EnableNotifications/useNotifications";
import { useTheme, Theme } from "@/lib/theme";
import ScrollableFeedProvider from "@/components/ScrollableFeedProvider";
import { useLocalSearchParams } from "expo-router";

function LocationFeedScreen() {
  // Extract navigation params at screen level, outside scroll context
  const { taskId, content_type } = useLocalSearchParams<{
    taskId: string;
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();

  const { enableNotifications } = useNotifications();
  const [activeLivekitRoom, setActiveLivekitRoom] = useAtom(
    activeLivekitRoomState
  );
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    enableNotifications();
  }, []);

  return (
    <Suspense fallback={<ActivityIndicator />}>
      <GestureHandlerRootView style={styles.container}>
        <ScrollableFeedProvider>
          <LocationFeed
            taskId={taskId as string}
            content_type={
              (content_type as
                | "last24h"
                | "youtube_only"
                | "social_media_only") || "last24h"
            }
          />
        </ScrollableFeedProvider>
      </GestureHandlerRootView>
    </Suspense>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
  });

export default LocationFeedScreen;
