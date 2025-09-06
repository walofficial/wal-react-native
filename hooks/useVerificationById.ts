import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FeedPost, getUserVerification } from '@/lib/api/generated';
import { isWeb } from '@/lib/platform';
import {
  getLocationFeedPaginatedInfiniteOptions,
  getUserVerificationOptions,
  getUserVerificationQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { useAtomValue } from 'jotai';
import { debouncedSearchValueAtom } from '@/lib/state/search';
import useUserFeedIds from './useUserFeedIds';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';

function useVerificationById(
  verificationId: string,
  enabled: boolean = false,
  {
    refetchInterval,
  }: {
    refetchInterval?: number;
  } = {},
) {
  const queryClient = useQueryClient();
  const globalSearchTerm = useAtomValue(debouncedSearchValueAtom);
  const { factCheckFeedId } = useUserFeedIds();
  const queryOptions = getUserVerificationOptions({
    query: {
      verification_id: verificationId,
    },
  });
  const { data, isLoading, isSuccess, isError } = useQuery({
    ...queryOptions,
    queryFn: async (): Promise<FeedPost> => {
      const response = await getUserVerification({
        query: {
          verification_id: verificationId,
        },
        throwOnError: true,
      });

      const feedOptions = feedQueryOptionsByContentType(
        globalSearchTerm,
        factCheckFeedId,
      );
      feedOptions.forEach(({ queryKey }) => {
        queryClient.setQueryData(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => {
              return page.map((feedPost) => {
                return feedPost.id === response.data?.id
                  ? response.data
                  : feedPost;
              });
            }),
          };
        });
      });

      if (!response.data) {
        throw new Error('Verification not found');
      }
      return response.data;
    },
    queryKey: getUserVerificationQueryKey({
      query: {
        verification_id: verificationId,
      },
    }),
    enabled: enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retryDelay: 1000,
    refetchInterval: (query) => {
      // The query parameter is the entire query object
      const data = query?.state?.data;
      // If we can't access data, don't refetch to avoid unnecessary requests
      if (!data) return false;

      return data.ai_video_summary_status === 'PENDING' ||
        data.fact_check_status === 'PENDING' ||
        data.metadata_status === 'PENDING' ||
        data.is_live
        ? refetchInterval
        : false;
    },
  });
  return { data, isLoading, isSuccess, isError };
}

function feedQueryOptionsByContentType(
  globalSearchTerm: string,
  feedId: string,
) {
  return [
    getLocationFeedPaginatedInfiniteOptions({
      query: {
        page_size: LOCATION_FEED_PAGE_SIZE,
        search_term: globalSearchTerm,
        content_type_filter: 'last24h',
      },
      path: {
        feed_id: feedId,
      },
    }),
    getLocationFeedPaginatedInfiniteOptions({
      query: {
        page_size: LOCATION_FEED_PAGE_SIZE,
        search_term: globalSearchTerm,
        content_type_filter: 'youtube_only',
      },
      path: {
        feed_id: feedId,
      },
    }),
    getLocationFeedPaginatedInfiniteOptions({
      query: {
        page_size: LOCATION_FEED_PAGE_SIZE,
        search_term: globalSearchTerm,
        content_type_filter: 'social_media_only',
      },
      path: {
        feed_id: feedId,
      },
    }),
  ];
}
export default useVerificationById;
