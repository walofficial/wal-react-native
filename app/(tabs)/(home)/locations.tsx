import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import useLocationsInfo from '@/hooks/useLocationsInfo';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';
import useFeeds from '@/hooks/useFeeds';
import { useTheme, FontSizes } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LocationRow = {
  id: string;
  title: string;
  kind: 'at_location' | 'nearby';
};

export default function LocationsListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { headerHeight } = useFeeds();
  const { categoryId } = useUserFeedIds();

  const { data, isFetching, errorMsg } = useLocationsInfo(categoryId);

  const rows: LocationRow[] = useMemo(() => {
    const items: LocationRow[] = [];

    for (const feed of data?.feeds_at_location ?? []) {
      if (!feed?.id) continue;
      items.push({
        id: feed.id,
        title: feed.display_name,
        kind: 'at_location',
      });
    }

    for (const entry of data?.nearest_feeds ?? []) {
      const feed = entry?.feed;
      if (!feed?.id) continue;
      items.push({
        id: feed.id,
        title: feed.display_name,
        kind: 'nearby',
      });
    }

    return items;
  }, [data]);

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
          paddingTop: headerHeight + insets.top,
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
      ) : rows.length === 0 ? (
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
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.feedItem.background,
                borderColor: separatorColor,
              },
            ]}
          >
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1;
              return (
                <React.Fragment key={`${row.kind}_${row.id}`}>
                  <Pressable
                    onPress={() => handleNavigateToFeed(row.id)}
                    style={({ pressed }) => [
                      styles.row,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.rowTitle, { color: theme.colors.text }]}
                    >
                      {row.title}
                    </Text>
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
  rowTitle: {
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
});
