import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function useTask(taskId: string) {
  const {
    data: task,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => {
      return api.getSingleTaskById(taskId);
    },
    enabled: !!taskId,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  return {
    task,
    isFetching,
    error,
  };
}
