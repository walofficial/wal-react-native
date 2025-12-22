import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { SectionHeader } from '@/components/SectionHeader';
import useLocationsInfo from '@/hooks/useLocationsInfo';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';
import useFeeds from '@/hooks/useFeeds';
import { useTheme, FontSizes } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTranslation from '@/hooks/useTranslation';

const PINK_ACCENT = '#FF4B8C';

type LocationRow = {
  id: string;
  title: string;
  kind: 'at_location' | 'nearby';
  activityLevel: number; // 1-4 bars
};

// Activity bar indicator component (iPhone battery-style)
const ActivityBars = ({ level }: { level: number }) => {
  const bars = [1, 2, 3, 4];
  const barHeight = [6, 9, 12, 15];

  return (
    <View style={styles.activityBarsContainer}>
      {bars.map((bar, idx) => (
        <View
          key={bar}
          style={[
            styles.activityBar,
            {
              height: barHeight[idx],
              backgroundColor:
                idx < level ? PINK_ACCENT : 'rgba(255,75,140,0.2)',
            },
          ]}
        />
      ))}
    </View>
  );
};

// Get activity level with fallback (1-4 range, default to 1)
const getActivityLevel = (level: number | undefined | null): number => {
  if (level === undefined || level === null || level < 1) return 1;
  if (level > 4) return 4;
  return level;
};

export default function LocationsListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { headerHeight } = useFeeds();
  const { categoryId } = useUserFeedIds();
  const { t } = useTranslation();

  const { data, isFetching, errorMsg } = useLocationsInfo(categoryId);

  const feedsAtLocation: LocationRow[] = useMemo(() => {
    const items: LocationRow[] = [];
    for (const feed of data?.feeds_at_location ?? []) {
      if (!feed?.id) continue;
      items.push({
        id: feed.id,
        title: feed.display_name,
        kind: 'at_location',
        activityLevel: getActivityLevel((feed as any).activity_level),
      });
    }
    return items;
  }, [data]);

  const nearestFeeds: LocationRow[] = useMemo(() => {
    const items: LocationRow[] = [];
    for (const entry of data?.nearest_feeds ?? []) {
      const feed = entry?.feed;
      if (!feed?.id) continue;
      items.push({
        id: feed.id,
        title: feed.display_name,
        kind: 'nearby',
        activityLevel: getActivityLevel((feed as any).activity_level),
      });
    }
    return items;
  }, [data]);

  const hasAnyLocations = feedsAtLocation.length > 0 || nearestFeeds.length > 0;

  const handleNavigateToFeed = (feedId: string) => {
    router.navigate({
      pathname: '/(tabs)/(home)/[feedId]',
      params: { feedId },
    });
  };

  const backgroundColor = theme.colors.background;
  const separatorColor =
    theme.colors.background === '#000000'
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.08)';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor,
        },
      ]}
    >
      {isFetching ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.text} />
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <Text
            style={[
              styles.helperText,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            Location is unavailable right now.
          </Text>
        </View>
      ) : !hasAnyLocations ? (
        <View style={styles.centered}>
          <Text
            style={[
              styles.helperText,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            No locations found.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {feedsAtLocation.length > 0 && (
            <>
              <SectionHeader
                icon={
                  <Ionicons
                    name="location"
                    size={22}
                    color={theme.colors.text}
                  />
                }
                text={t('common.locations_nearby')}
              />
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.feedItem.background,
                    borderColor: separatorColor,
                  },
                ]}
              >
                {feedsAtLocation.map((row, idx) => {
                  const isLast = idx === feedsAtLocation.length - 1;
                  return (
                    <React.Fragment key={`${row.kind}_${row.id}`}>
                      <Pressable
                        onPress={() => handleNavigateToFeed(row.id)}
                        style={({ pressed }) => [
                          styles.row,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <View style={styles.rowContent}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.rowTitle,
                              { color: theme.colors.text },
                            ]}
                          >
                            {row.title}
                          </Text>
                          <ActivityBars level={row.activityLevel} />
                        </View>
                      </Pressable>
                      {!isLast && (
                        <View
                          style={[
                            styles.separator,
                            { backgroundColor: separatorColor },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}

          {nearestFeeds.length > 0 && (
            <>
              <View style={styles.sectionSpacing} />
              <SectionHeader
                icon={
                  <Ionicons
                    name="compass-outline"
                    size={22}
                    color={theme.colors.text}
                  />
                }
                text={t('common.locations_far')}
              />
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.feedItem.background,
                    borderColor: separatorColor,
                  },
                ]}
              >
                {nearestFeeds.map((row, idx) => {
                  const isLast = idx === nearestFeeds.length - 1;
                  return (
                    <React.Fragment key={`${row.kind}_${row.id}`}>
                      <Pressable
                        onPress={() => handleNavigateToFeed(row.id)}
                        style={({ pressed }) => [
                          styles.row,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <View style={styles.rowContent}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.rowTitle,
                              { color: theme.colors.text },
                            ]}
                          >
                            {row.title}
                          </Text>
                          <ActivityBars level={row.activityLevel} />
                        </View>
                      </Pressable>
                      {!isLast && (
                        <View
                          style={[
                            styles.separator,
                            { backgroundColor: separatorColor },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionSpacing: {
    height: 24,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: {
    flex: 1,
    fontSize: FontSizes.medium,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  helperText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Activity bars (battery-style indicator)
  activityBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 15,
  },
  activityBar: {
    width: 4,
    borderRadius: 1.5,
  },
});
