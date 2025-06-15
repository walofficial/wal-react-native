import api from "@/lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useLocationSession from "./useLocationSession";
import { useIsFocused } from "@react-navigation/native";

export default function useLocationsInfo(
  categoryId: string,
  enabled: boolean = true
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
    queryKey: [
      "locations-feed",
      categoryId,
      location?.coords.latitude,
      location?.coords.longitude,
      errorMsg,
    ],
    queryFn: () => {
      return api.fetchLocations(categoryId, location?.coords, errorMsg);
    },
    enabled: !!categoryId && enabled && (!!location || !!errorMsg),
    placeholderData: keepPreviousData,
    subscribed: isFocused,
  });

  return {
    data: locations || {
      nearest_tasks: [],
      tasks_at_location: [],
    },
    location,
    errorMsg,
    isFetching: locationsIsFetching || isGettingLocation,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  };
}
