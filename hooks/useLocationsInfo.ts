import { keepPreviousData, useQuery } from '@tanstack/react-query';
import useLocationSession from './useLocationSession';
import { useIsFocused } from '@react-navigation/native';
import { getLocationFeedsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export default function useLocationsInfo(
  categoryId: string,
  enabled: boolean = true,
) {
  const isFocused = useIsFocused();
  const { location, errorMsg, isGettingLocation } = useLocationSession();
  const {
    data: locations,
    isFetching: locationsIsFetching,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  } = useQuery({
    ...getLocationFeedsOptions({
      query: {
        category_id: categoryId,
      },
      headers: {
        'x-user-location-latitude': location?.coords?.latitude || 0,
        'x-user-location-longitude': location?.coords?.longitude || 0,
      },
    }),
    enabled: !!categoryId && enabled && (!!location || !!errorMsg),
    placeholderData: keepPreviousData,
    // subscribed: isFocused,
    staleTime: 1000 * 60 * 5,
  });

  return {
    data: locations || {
      nearest_feeds: [],
      feeds_at_location: [],
    },
    defaultFeedId:
      locations?.feeds_at_location?.[0]?.id ||
      locations?.nearest_feeds?.[0]?.feed?.id ||
      '',
    location,
    errorMsg,
    isFetching: locationsIsFetching || isGettingLocation,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  };
}
