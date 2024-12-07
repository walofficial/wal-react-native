import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

function useGoLive() {
  const goLiveMutation = useMutation({
    onMutate: (taskId: string) => {},
    mutationFn: (taskId: string) => api.goLive(taskId),
    onSuccess: (res, taskId) => {},
  });

  return {
    goLiveMutation,
  };
}

export default useGoLive;
