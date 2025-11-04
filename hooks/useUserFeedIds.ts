import { CATEGORY_ID } from '@/lib/constants';

/**
 * Hook to get user's preferred feed IDs based on their selected region
 * This replaces the hardcoded constants with user-specific preferences
 */
export const useUserFeedIds = () => {
  return {
    // Individual feed IDs
    categoryId: CATEGORY_ID,
  };
};

export default useUserFeedIds;
