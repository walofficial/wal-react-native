import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";
import api from "@/lib/api";

function usePinVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      verificationId,
    }: {
      taskId: string;
      verificationId: string;
    }) => api.pinFeedItem(taskId, verificationId),
    onSuccess: async (_, variables) => {
      toast.success("დაიპინა");

      queryClient.invalidateQueries({
        queryKey: ["task-stories-paginated"],
      });

      queryClient.invalidateQueries({
        queryKey: ["pinned-feed-item", variables.taskId],
      });
    },
    onError: (error) => {
      toast.error("დაიპინვა ვერ მოხერხდა");
    },
  });
}

export default usePinVerification;
