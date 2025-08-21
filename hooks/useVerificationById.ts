// @ts-nocheck
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserVerification, LocationFeedPost } from "@/lib/api/generated";
import { isWeb } from "@/lib/platform";
import { getUserVerificationOptions } from "@/lib/api/generated/@tanstack/react-query.gen";

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
    useQuery({
      ...getUserVerificationOptions({
        query: {
          verification_id: verificationId,
        },
      }),
      throwOnError: true,
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
