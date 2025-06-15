import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMakePublicMutation(verificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isPublic: boolean) =>
      api.updateUserVerificationVisibility(verificationId, isPublic),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["location-feed-paginated"] });
      queryClient.invalidateQueries({
        queryKey: ["user-verifications-paginated"],
      });
    },
  });
}
