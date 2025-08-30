import { HEADER_HEIGHT, HEADER_HEIGHT_WITH_TABS } from '@/lib/constants';
import { useLocalSearchParams } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useUserFeedIds } from './useUserFeedIds';

export default function useFeeds() {
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const hhtabs = useAtomValue(HEADER_HEIGHT_WITH_TABS);
  const hh = useAtomValue(HEADER_HEIGHT);

  // Use user's preferred feed IDs instead of hardcoded constants
  const { factCheckFeedId, newsFeedId } = useUserFeedIds();

  const isFactCheckFeed = factCheckFeedId === feedId;
  const isNewsFeed = newsFeedId === feedId;
  const finalHeight = isFactCheckFeed
    ? hhtabs
    : isNewsFeed
      ? hh
      : !isNewsFeed && !isFactCheckFeed && !feedId
        ? hh
        : hhtabs;

  return {
    // Add little padding
    headerHeight: finalHeight + 10,
    factCheckFeedId,
    newsFeedId,
    isFactCheckFeed,
    isNewsFeed,
  };
}
