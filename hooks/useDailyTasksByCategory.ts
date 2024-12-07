import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useDailyTasksByCategory(
  categoryId: string,
  enabled: boolean = true
) {
  const {
    data: categoriesTasks,
    isFetching: categoriesTasksIsFetching,
    error: categoriesTasksError,
  } = useQuery({
    queryKey: ["tasks-by-categories", categoryId],
    queryFn: () => {
      return api.fetchDailyTasksByCategory(categoryId);
    },
    enabled: !!categoryId && enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchIntervalInBackground: false,
    initialData: null,
  });
  // console.log(location, categoriesTasksIsFetching);

  return {
    data: categoriesTasks || [],
    isFetching: categoriesTasksIsFetching,
    error: categoriesTasksError,
  };
}
