import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SheetManager } from "react-native-actions-sheet";

export function useMakePublicMutation(verificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isPublic: boolean) =>
      api.updateUserVerificationVisibility(verificationId, isPublic),
    onSuccess: () => {
      SheetManager.hide("user-make-it-public-sheet");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["location-feed-paginated"] });
      queryClient.invalidateQueries({
        queryKey: ["user-verifications-paginated"],
      });
    },
  });
}
