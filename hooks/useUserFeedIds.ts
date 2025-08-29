
import { CATEGORY_ID } from '@/lib/constants';
import useAuth from './useAuth';

/**
 * Hook to get user's preferred feed IDs based on their selected region
 * This replaces the hardcoded constants with user-specific preferences
 */
export const useUserFeedIds = () => {
  const { user } = useAuth()

  return {
    // Individual feed IDs
    newsFeedId: user?.preferred_news_feed_id || "",
    factCheckFeedId: user?.preferred_fact_check_feed_id || "",
    categoryId: CATEGORY_ID
  };
};

export default useUserFeedIds;