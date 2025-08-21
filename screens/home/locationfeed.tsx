import React, { Suspense, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LocationFeed from "@/components/LocationFeed";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNotifications } from "@/components/EnableNotifications/useNotifications";
import { useTheme, Theme } from "@/lib/theme";
import ScrollableFeedProvider from "@/components/ScrollableFeedProvider";
import { useLocalSearchParams } from "expo-router";

function LocationFeedScreen() {
  // Extract navigation params at screen level, outside scroll context
  const { feedId, content_type } = useLocalSearchParams<{
    feedId: string;
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();

  const { enableNotifications } = useNotifications();
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
            feedId={feedId as string}
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
