import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHaptics } from '@/lib/haptics';
import {
  getFactCheckOptions,
  getFactCheckQueryKey,
  rateFactCheckMutation,
  unrateFactCheckMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export function useFactCheckRating(verificationId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    ...getFactCheckOptions({
      path: {
        verification_id: verificationId,
      },
    }),
  });

  const rateMutation = useMutation({
    ...rateFactCheckMutation(),
    onMutate: async () => {
      // Optimistically update the rating state
      await queryClient.cancelQueries({
        queryKey: getFactCheckQueryKey({
          path: { verification_id: verificationId },
        }),
      });
      const previousData = queryClient.getQueryData(
        getFactCheckQueryKey({ path: { verification_id: verificationId } }),
      );

      queryClient.setQueryData(
        getFactCheckQueryKey({ path: { verification_id: verificationId } }),
        (old: any) => ({
          ...old,
          has_rated: true,
          ratings_count: (old?.ratings_count || 0) + 1,
        }),
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          getFactCheckQueryKey({ path: { verification_id: verificationId } }),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getFactCheckQueryKey({
          path: { verification_id: verificationId },
        }),
      });
    },
  });

  const unrateMutation = useMutation({
    ...unrateFactCheckMutation(),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: getFactCheckQueryKey({
          path: { verification_id: verificationId },
        }),
      });
      const previousData = queryClient.getQueryData(
        getFactCheckQueryKey({ path: { verification_id: verificationId } }),
      );

      queryClient.setQueryData(
        getFactCheckQueryKey({ path: { verification_id: verificationId } }),
        (old: any) => ({
          ...old,
          has_rated: false,
          ratings_count: Math.max(0, (old?.ratings_count || 0) - 1),
        }),
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          getFactCheckQueryKey({ path: { verification_id: verificationId } }),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getFactCheckQueryKey({
          path: { verification_id: verificationId },
        }),
      });
    },
  });

  const haptic = useHaptics();

  const handleRating = () => {
    // Trigger haptic feedback
    haptic('Medium');

    if (data?.has_rated) {
      unrateMutation.mutate({
        path: { verification_id: verificationId },
      });
    } else {
      rateMutation.mutate({
        path: {
          verification_id: verificationId,
        },
      });
    }
  };

  return {
    hasRated: data?.has_rated ?? false,
    isLoading,
    handleRating,
  };
}
