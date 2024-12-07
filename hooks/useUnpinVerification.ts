import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";
import api from "@/lib/api";

function useUnpinVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      verificationId,
    }: {
      taskId: string;
      verificationId: string;
    }) => api.removePinnedFeedItem(taskId, verificationId),
    onSuccess: async (_, variables) => {
      toast.success("წაიშალა");
      queryClient.invalidateQueries({
        queryKey: ["task-stories-paginated"],
      });

      queryClient.resetQueries({
        queryKey: ["pinned-feed-item", variables.taskId],
      });

      queryClient.invalidateQueries({
        queryKey: ["pinned-feed-item", variables.taskId],
      });
    },
    onError: (error) => {
      console.error("Error unpinning verification", error);
      toast.error("Failed to unpin verification. Please try again.");
    },
  });
}

export default useUnpinVerification;
