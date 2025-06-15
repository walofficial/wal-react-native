import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import api from "@/lib/api";

interface CreateSpaceParams {
  description: string;
  taskId: string;
  scheduled_at?: string; // ISO string date format
}

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({
      description,
      taskId,
      scheduled_at,
    }: CreateSpaceParams) => {
      const trimmedText = description.trim();
      if (!trimmedText) {
        throw new Error("ოთახის აღწერა სავალდებულოა");
      }
      if (trimmedText.split(" ").length > 100) {
        throw new Error("დიდი აღწერაა");
      }
      return api.createSpace({
        text_content: trimmedText,
        task_id: taskId,
        scheduled_at,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });

      // Different success message based on whether it's scheduled or not
      const successMessage = data.scheduled_at
        ? "ოთახი დაიგეგმა"
        : "ოთახი შექმნილია";

      if (data.scheduled_at) {
        toast.success(successMessage, {
          id: "space-created",
        });
      }
      // Only navigate to verification if it's not a scheduled space
      if (!data.scheduled_at) {
        router.navigate({
          pathname: "/verification/[verificationId]",
          params: {
            verificationId: data.verification_id,
          },
        });
      } else {
        router.back();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create space",
        {
          id: "space-created-error",
        }
      );
    },
  });
};
