import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { isWeb } from "@/lib/platform";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { debouncedSearchValueAtom } from "@/lib/state/search";

export function useLocationFeedPaginated({
  enabled = true,
  taskId,
  pageSize = 10,
  content_type,
  searchTerm: externalSearchTerm,
  debounceDelay = 500,
}: {
  enabled?: boolean;
  taskId: string;
  pageSize?: number;
  content_type: "last24h" | "youtube_only" | "social_media_only";
  searchTerm?: string;
  debounceDelay?: number;
}) {
  // Global search state from ProfileHeader
  const globalSearchTerm = useAtomValue(debouncedSearchValueAtom);

  // Local debounced search state
  const [debouncedLocalSearch, setDebouncedLocalSearch] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the external search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedLocalSearch(externalSearchTerm || "");
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
  const finalSearchTerm = externalSearchTerm !== undefined ? debouncedLocalSearch : globalSearchTerm;

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
    queryKey: ["location-feed-paginated", taskId, content_type, finalSearchTerm],
    queryFn: ({ pageParam = 1 }) => {
      // For now, we'll call the existing API without search
      // The search filtering can be done on the client side or
      // you can update your API to support search parameters
      if (isWeb) {
        return api.public_getLocationFeedPaginated(taskId, pageParam);
      } else {
        return api.getLocationFeedPaginated(taskId, pageParam, content_type, finalSearchTerm || "");
      }
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    enabled,
    initialPageParam: 1,
    retry: 2,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (data) => {
      const hasLiveStream = data?.state.data?.pages?.[0]?.data.some(
        (item) => item.is_live
      );

      return hasLiveStream ? 3000 : false;
    },
    // subscribed: isFocused,
  });

  const items = data?.pages.flatMap((page) => page.data) || [];

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
