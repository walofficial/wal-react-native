import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBlockedFriendsQueryKey,
  getFriendsListQueryKey,
  getLocationFeedPaginatedInfiniteQueryKey,
  getLocationFeedsQueryKey,
  unblockUserUnblockTargetIdPostMutation,
} from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

function useUnblockMutation() {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();

  return useMutation({
    ...unblockUserUnblockTargetIdPostMutation(),
    onSuccess: (_, variables) => {
      success({ title: "განიბლოკა" });
      queryClient.invalidateQueries({ queryKey: getBlockedFriendsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getFriendsListQueryKey() });
      queryClient.invalidateQueries({ queryKey: getLocationFeedPaginatedInfiniteQueryKey({}), exact: false });
    },
    onError: (error) => {
      console.log("error", error);
      errorToast({
        title: t("errors.general_error"),
        description: t("errors.general_error")
      });
    },
  });
}

export default useUnblockMutation;
