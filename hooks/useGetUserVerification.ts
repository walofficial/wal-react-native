import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserVerification } from "@/lib/interfaces";

function useGetUserVerification(
  taskId: string,
  userId: string,
  enabled: boolean = true
) {
  const { data, isFetching, isSuccess, isError } =
    useQuery<UserVerification | null>({
      queryKey: ["user-verification", taskId, userId],
      queryFn: () => {
        return api.getUserVerification(taskId, userId);
      },
      enabled,
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    });

  return { data, isFetching, isSuccess, isError };
}

export default useGetUserVerification;
