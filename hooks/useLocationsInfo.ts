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
    subscribed: isFocused,
  });

  return {
    data: locations || {
      nearest_feeds: [],
      feeds_at_location: [],
    },
    location,
    errorMsg,
    isFetching: locationsIsFetching || isGettingLocation,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  };
}
