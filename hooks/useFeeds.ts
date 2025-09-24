import { HEADER_HEIGHT, HEADER_HEIGHT_WITH_TABS } from '@/lib/constants';
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  useSegments,
} from 'expo-router';
import { useAtomValue } from 'jotai';
import { useUserFeedIds } from './useUserFeedIds';

export default function useFeeds() {
  const segments = useSegments();
  // @ts-ignore
  const isFactCheckFeed = segments[1] === '(fact-check)';
  // @ts-ignore
  const isNewsFeed = segments[1] === '(news)';
  // This component should be used carefully as useGlobalSearchParams causes rerender everywhere when params change.
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const hhtabs = useAtomValue(HEADER_HEIGHT_WITH_TABS);
  const hh = useAtomValue(HEADER_HEIGHT);
  const hasFeedId = feedId !== undefined && feedId !== null && feedId !== '';
  // Use user's preferred feed IDs instead of hardcoded constants
  const { factCheckFeedId, newsFeedId } = useUserFeedIds();
  // having feedID means it's part from (home)
  const finalHeight = !!isFactCheckFeed || hasFeedId ? hhtabs : hh;

  return {
    // Add little padding
    headerHeight: finalHeight + 10,
    factCheckFeedId,
    newsFeedId,
    isFactCheckFeed,
    isNewsFeed,
  };
}
