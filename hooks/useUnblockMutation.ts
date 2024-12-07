import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";
import api from "@/lib/api";

function useUnblockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.unblockUser(userId),
    onSuccess: (_, variables) => {
      toast.success("მომხმარებელი განბლოკილია");
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friendsFeed"] });
      queryClient.invalidateQueries({ queryKey: ["location-feed-paginated"] });
    },
    onError: (error) => {
      console.log("error", error);
      toast.error("დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან");
    },
  });
}

export default useUnblockMutation;
