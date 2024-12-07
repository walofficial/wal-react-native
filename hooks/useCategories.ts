import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useLocation from "./useLocation";

export default function useCategories() {
  const { location } = useLocation();

  const {
    data: categories,
    isFetching: categoriesIsFetching,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories", location?.coords],
    queryFn: () => {
      return api.fetchDailyTasksCategories(location?.coords);
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    initialData: [],
  });

  return {
    categories,
    categoriesIsFetching,
    categoriesError,
  };
}
