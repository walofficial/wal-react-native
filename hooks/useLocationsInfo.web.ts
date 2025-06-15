import api from "@/lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export default function useLocationsInfo(
  categoryId: string,
  enabled: boolean = true
) {
  const {
    data: locations,
    isFetching: locationsIsFetching,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  } = useQuery({
    queryKey: ["locations-feed", categoryId],
    queryFn: () => {
      return api.PUBLIC_fetchLocations(categoryId);
    },
    enabled: !!categoryId && enabled,
    placeholderData: keepPreviousData,
  });

  return {
    data: locations || {
      nearest_tasks: [],
      tasks_at_location: [],
    },
    location,
    isFetching: locationsIsFetching,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  };
}
