import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { LocationFeedPost } from "@/lib/interfaces";
import { isWeb } from "@/lib/platform";

function useVerificationById(
  verificationId: string,
  enabled: boolean = false,
  {
    refetchInterval,
  }: {
    refetchInterval?: number;
  } = {}
) {
  const { data, isLoading, isSuccess, isError } =
    useQuery<LocationFeedPost | null>({
      queryKey: ["verification-by-id", verificationId],
      queryFn: () => {
        return isWeb
          ? api.getPublicVerificationById(verificationId)
          : api.getVerificationById(verificationId);
      },
      enabled: enabled,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retryDelay: 1000,
      refetchInterval: (query) => {
        // The query parameter is the entire query object
        const data = query?.state?.data;
        // If we can't access data, don't refetch to avoid unnecessary requests
        if (!data) return false;

        return data.ai_video_summary_status === "PENDING" ||
          data.fact_check_status === "PENDING" ||
          data.metadata_status === "PENDING"
          ? refetchInterval
          : false;
      },
      // placeholderData: keepPreviousData,
    });

  return { data, isLoading, isSuccess, isError };
}

export default useVerificationById;
