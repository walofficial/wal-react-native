import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@backpackapp-io/react-native-toast";
import * as Haptics from "expo-haptics";
import { useHaptics } from "@/lib/haptics";
import { isWeb } from "@/lib/platform";

export function useLikeButton(verificationId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["likes", verificationId],
    queryFn: () => api.getLikeCount(verificationId),
    placeholderData: { likes_count: 0, has_liked: false },
  });

  const likeMutation = useMutation({
    mutationFn: () => api.likeVerification(verificationId),
    onMutate: async () => {
      // Optimistically update the like count
      await queryClient.cancelQueries({ queryKey: ["likes", verificationId] });
      const previousData = queryClient.getQueryData(["likes", verificationId]);

      queryClient.setQueryData(["likes", verificationId], (old: any) => ({
        likes_count: old.likes_count + 1,
        has_liked: true,
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["likes", verificationId],
          context.previousData
        );
      }
      // toast("Failed to like", { id: "like-error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["likes", verificationId] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => api.unlikeVerification(verificationId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["likes", verificationId] });
      const previousData = queryClient.getQueryData(["likes", verificationId]);

      queryClient.setQueryData(["likes", verificationId], (old: any) => ({
        likes_count: Math.max(0, old.likes_count - 1),
        has_liked: false,
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["likes", verificationId],
          context.previousData
        );
      }
      // toast("Failed to unlike", { id: "unlike-error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["likes", verificationId] });
    },
  });

  const haptic = useHaptics();

  const handleLike = () => {
    // Trigger haptic feedback
    haptic("Medium");

    if (data?.has_liked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return {
    likeCount: data?.likes_count ?? 0,
    isLiked: data?.has_liked ?? false,
    isLoading,
    handleLike,
  };
}
