import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useRouter } from "expo-router";
import { createSpaceSpaceCreateSpacePostMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";


export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success, error: errorToast } = useToast();

  return useMutation({
    ...createSpaceSpaceCreateSpacePostMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });

      // Different success message based on whether it's scheduled or not
      const successMessage = data.scheduled_at
        ? "ოთახი დაიგეგმა"
        : "ოთახი შექმნილია";

      if (data.scheduled_at) {
        success({ title: successMessage });
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
      errorToast({
        title: t("errors.failed_to_create_space"),
        description: error instanceof Error ? error.message : t("errors.failed_to_create_space")
      });
    },
  });
};
