import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCommentCount(verificationId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["comments-count", verificationId],
    staleTime: 1000 * 60 * 5,
    queryFn: () => api.getVerificationCommentsCount(verificationId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    commentCount: data?.count ?? 0,
    isLoading,
  };
}
