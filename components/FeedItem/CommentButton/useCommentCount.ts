import { useQuery } from '@tanstack/react-query';
import { getVerificationCommentsCountOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useCommentCount(verificationId: string) {
  const { data, isLoading } = useQuery({
    ...getVerificationCommentsCountOptions({
      path: {
        verification_id: verificationId,
      },
    }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    commentCount: data?.count ?? 0,
    isLoading,
  };
}
