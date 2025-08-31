import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { isWeb } from '@/lib/platform';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { debouncedSearchValueAtom } from '@/lib/state/search';
import {
  getLocationFeedPaginatedInfiniteOptions,
  getUserVerificationOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { getLocationFeedPaginated } from '@/lib/api/generated/sdk.gen';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';

export function useLocationFeedPaginated({
  enabled = true,
  feedId,
  pageSize = LOCATION_FEED_PAGE_SIZE,
  content_type,
  searchTerm: externalSearchTerm,
  debounceDelay = 500,
}: {
  enabled?: boolean;
  feedId: string;
  pageSize?: number;
  content_type: 'last24h' | 'youtube_only' | 'social_media_only';
  searchTerm?: string;
  debounceDelay?: number;
}) {
  const queryClient = useQueryClient();
  // Global search state from ProfileHeader
  const globalSearchTerm = useAtomValue(debouncedSearchValueAtom);

  // Local debounced search state
  const [debouncedLocalSearch, setDebouncedLocalSearch] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the external search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedLocalSearch(externalSearchTerm || '');
    }, debounceDelay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [externalSearchTerm, debounceDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Use the external search term if provided, otherwise use global search
  const finalSearchTerm =
    externalSearchTerm !== undefined ? debouncedLocalSearch : globalSearchTerm;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isRefetching,
    error,
    refetch,
    hasPreviousPage,
    isPending,
  } = useInfiniteQuery({
    ...getLocationFeedPaginatedInfiniteOptions({
      query: {
        page_size: pageSize,
        search_term: finalSearchTerm,
        content_type_filter: content_type,
      },
      path: {
        feed_id: feedId,
      },
    }),
    queryFn: async ({ pageParam, queryKey, signal }) => {
      const { data } = await getLocationFeedPaginated({
        ...queryKey,
        query: {
          page: pageParam as number,
          page_size: pageSize,
          search_term: finalSearchTerm,
          content_type_filter: content_type,
        },
        path: {
          feed_id: feedId,
        },
        signal,
        throwOnError: true,
      });
      data.forEach((item) => {
        const queryOptions = getUserVerificationOptions({
          query: {
            verification_id: item.id,
          },
        });
        queryClient.setQueryData(queryOptions.queryKey, {
          ...item,
        });
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we received fewer items than pageSize, there is no next page
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Use the number of pages already loaded to compute the next page number
      // Starts at 1, so next page after N pages is N + 1
      return allPages.length + 1;
    },
    enabled,
    initialPageParam: 1,
    retry: 2,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (data) => {
      const hasLiveStream = data?.state.data?.pages?.[0]?.some(
        (item) => item.is_live,
      );
      return hasLiveStream ? 3000 : false;
    },
    // subscribed: isFocused,
  });
  const items = data?.pages.flatMap((page) => page) || [];
  return {
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isRefetching,
    error,
    isPending,
    refetch: () => {
      refetch();
    },
    searchTerm: finalSearchTerm, // Expose the final search term being used
    isSearching: Boolean(finalSearchTerm), // Helper to know if search is active
  };
}
