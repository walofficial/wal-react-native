import api from "@/lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useLocation from "./useLocation";
import { useEffect } from "react";
import { toast } from "@backpackapp-io/react-native-toast";
import { LocationsResponse } from "@/lib/interfaces";
import useLocationSession from "./useLocationSession";

export default function useLocationsInfo(
  categoryId: string,
  enabled: boolean = true
) {
  const { location } = useLocationSession();

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
    ],
    queryFn: () => {
      return api.fetchLocations(categoryId, location?.coords);
    },
    enabled: !!categoryId && enabled && !!location,
    placeholderData: keepPreviousData,
  });

  return {
    data: locations || {
      nearest_tasks: [],
      tasks_at_location: [],
    },
    isFetching: locationsIsFetching,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  };
}
