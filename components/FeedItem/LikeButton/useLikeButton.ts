import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHaptics } from '@/lib/haptics';
import {
  getVerificationLikesCountOptions,
  getVerificationLikesCountQueryKey,
  likeVerificationMutation,
  unlikeVerificationMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export function useLikeButton(verificationId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    ...getVerificationLikesCountOptions({
      path: {
        verification_id: verificationId,
      },
    }),
    placeholderData: { likes_count: 0, has_liked: false },
  });

  const queryKey = getVerificationLikesCountQueryKey({
    path: {
      verification_id: verificationId,
    },
  });

  const likeMutation = useMutation({
    ...likeVerificationMutation(),
    onMutate: async () => {
      // Optimistically update the like count

      await queryClient.cancelQueries({
        queryKey,
      });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => ({
        likes_count: old.likes_count + 1,
        has_liked: true,
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      // toast("Failed to like", { id: "like-error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const unlikeMutation = useMutation({
    ...unlikeVerificationMutation(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => ({
        likes_count: Math.max(0, old.likes_count - 1),
        has_liked: false,
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      // toast("Failed to unlike", { id: "unlike-error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const haptic = useHaptics();

  const handleLike = () => {
    // Trigger haptic feedback
    haptic('Medium');

    if (data?.has_liked) {
      unlikeMutation.mutate({
        path: {
          verification_id: verificationId,
        },
      });
    } else {
      likeMutation.mutate({
        path: {
          verification_id: verificationId,
        },
      });
    }
  };

  return {
    likeCount: data?.likes_count ?? 0,
    isLiked: data?.has_liked ?? false,
    isLoading,
    handleLike,
  };
}
