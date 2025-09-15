import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LocationFeed from '@/components/LocationFeed';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotifications } from '@/components/EnableNotifications/useNotifications';
import { useTheme, Theme } from '@/lib/theme';
import ScrollableFeedProvider from '@/components/ScrollableFeedProvider';
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
} from 'expo-router';
import useGoLive from '@/hooks/useGoLive';

function LocationFeedScreen() {
  const { feedId } = useLocalSearchParams<{
    feedId: string;
  }>();
  const { enableNotifications } = useNotifications();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { goLiveMutation } = useGoLive();
  useEffect(() => {
    enableNotifications();
  }, []);

  useEffect(() => {
    goLiveMutation.mutateAsync({
      body: {
        feed_id: feedId,
      },
    });
  }, [feedId]);

  return (
    <Suspense fallback={<ActivityIndicator />}>
      <GestureHandlerRootView style={styles.container}>
        <ScrollableFeedProvider>
          <LocationFeed
            feedId={feedId as string}
            isFactCheckFeed={false}
            isNewsFeed={false}
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
