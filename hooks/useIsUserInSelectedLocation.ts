import { useLocalSearchParams } from "expo-router";
import useLocationsInfo from "./useLocationsInfo";
import useFeeds from "./useFeeds";
import { useUserFeedIds } from "./useUserFeedIds";

export default function useIsUserInSelectedLocation() {
  const params = useLocalSearchParams<{ feedId: string }>();
  const feedId = params.feedId;
  const { factCheckFeedId, newsFeedId } = useFeeds();
  const { categoryId } = useUserFeedIds();

  const {
    data: data,
    isFetching,
    isRefetching,
  } = useLocationsInfo(categoryId);
  return {
    isUserInSelectedLocation:
      data?.feeds_at_location.some((feed: any) => feed.id === feedId) ||
      factCheckFeedId === feedId ||
      newsFeedId === feedId,
    selectedLocation: data?.nearest_feeds.find(
      (item) => item.feed.id === feedId
    ),
    isGettingLocation: isFetching || isRefetching,
    isFactCheckFeed: factCheckFeedId === feedId,
    isNewsFeed: newsFeedId === feedId,
  };
}
