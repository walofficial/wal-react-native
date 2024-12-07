import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PublicVerification, UserVerification } from "@/lib/interfaces";

function useVerificationById(verificationId: string, enabled: boolean = true) {
  const { data, isFetching, isSuccess, isError } =
    useQuery<PublicVerification | null>({
      queryKey: ["verification-by-id", verificationId],
      queryFn: () => {
        return api.getVerificationById(verificationId);
      },
      enabled,
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

  return { data, isFetching, isSuccess, isError };
}

export default useVerificationById;
