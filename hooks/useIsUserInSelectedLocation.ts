import { useLocalSearchParams } from "expo-router";
import useLocationsInfo from "./useLocationsInfo";

export default function useIsUserInSelectedLocation() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const {
    data: data,
    isFetching,
    isRefetching,
  } = useLocationsInfo("669e9a03dd31644abb767337");

  return {
    isUserInSelectedLocation: data?.tasks_at_location.some(
      (task: any) => task.id === taskId
    ),
    selectedLocation: data?.nearest_tasks.find(
      (item) => item.task.id === taskId
    ),
    isGettingLocation: isFetching || isRefetching,
  };
}
