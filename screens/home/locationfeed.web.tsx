import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import LocationFeed from '@/components/LocationFeed';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAtom } from 'jotai';
import { scrollToTopState } from '@/lib/atoms/location';
import { useLocalSearchParams } from 'expo-router';

function LocationFeedScreen() {
  const [scrollToTop] = useAtom(scrollToTopState);

  // Extract navigation params at screen level, outside scroll context
  const { feedId, content_type } = useLocalSearchParams<{
    feedId: string;
    content_type: 'last24h' | 'youtube_only' | 'social_media_only';
  }>();

  // Add effect to handle scrolling to top for web
  useEffect(() => {
    if (scrollToTop > 0) {
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTop]);

  return (
    <Suspense fallback={<ActivityIndicator />}>
      <GestureHandlerRootView style={styles.container}>
        <LocationFeed
          feedId={feedId as string}
          content_type={
            (content_type as
              | 'last24h'
              | 'youtube_only'
              | 'social_media_only') || 'last24h'
          }
        />
      </GestureHandlerRootView>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LocationFeedScreen;
