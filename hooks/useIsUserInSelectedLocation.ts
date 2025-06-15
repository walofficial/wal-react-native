import { useGlobalSearchParams, useLocalSearchParams, usePathname } from "expo-router";
import useLocationsInfo from "./useLocationsInfo";
import useCountryFeed from "./useCountryFeed";

export default function useIsUserInSelectedLocation() {
  const params = useLocalSearchParams<{ taskId: string }>();
  const taskId = params.taskId;
  const { id: countryFeedId } = useCountryFeed();

  const {
    data: data,
    isFetching,
    isRefetching,
  } = useLocationsInfo("669e9a03dd31644abb767337");
  return {
    isUserInSelectedLocation:
      data?.tasks_at_location.some((task: any) => task.id === taskId) ||
      countryFeedId === taskId,
    selectedLocation: data?.nearest_tasks.find(
      (item) => item.task.id === taskId
    ),
    isGettingLocation: isFetching || isRefetching,
    isCountryFeed: countryFeedId === taskId,
  };
}
