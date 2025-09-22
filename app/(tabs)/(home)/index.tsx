import React, { useEffect } from 'react';
import { Text } from '@/components/ui/text';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import useLocationsInfo from '@/hooks/useLocationsInfo';
import { FontSizes, useTheme } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useFeeds from '@/hooks/useFeeds';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';
import { useTranslation } from '@/hooks/useTranslation';
import { Redirect } from 'expo-router';

export default function TaskScrollableView() {
  const { t } = useTranslation();
  const { categoryId } = useUserFeedIds();
  const {
    data: data,
    isFetching,
    errorMsg,
    defaultFeedId,
  } = useLocationsInfo(categoryId);
  const { headerHeight } = useFeeds();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!isFetching && !errorMsg && !!defaultFeedId) {
    return <Redirect href={{
      pathname: '/(tabs)/(home)/[feedId]',
      params: {
        feedId: defaultFeedId,
      },
    }} />;
  }

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
            {t('common.checking_location')}...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {t('common.location_check_failed_gps_description')}
          </Text>
        </View>
      ) : !data?.feeds_at_location?.length && !data?.nearest_feeds?.length ? (
        <View style={styles.statusContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {t('common.no_locations_found_description')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 20,
  },
  statusContainer: {
    alignItems: 'center',
    maxWidth: 280,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    fontWeight: '400',
  },
});
