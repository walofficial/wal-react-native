// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/api/generated";
import { useSetAtom } from "jotai";
import { displayedContactsAtom } from "@/components/ContactSyncSheet/atom";
import {
  checkRegisteredUsersQueryKey,
  getFriendRequestsQueryKey,
  sendFriendRequestMutation,
} from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

export const useFriendRequest = () => {
  const queryClient = useQueryClient();
  const setDisplayedContacts = useSetAtom(displayedContactsAtom);
  const { error: errorToast } = useToast();

  return useMutation({
    ...sendFriendRequestMutation(),
    onSuccess: (data: any, variables) => {
      if ((data as any)?.error_code === "ALREADY_SENT") {
        errorToast({
          title: t("errors.friend_request_already_sent"),
          description: t("errors.friend_request_already_sent")
        });
      }
      // Invalidate and refetch friend requests
      queryClient.invalidateQueries({ queryKey: getFriendRequestsQueryKey() });
      // Also refresh registered contacts list if present
      queryClient.invalidateQueries({ queryKey: checkRegisteredUsersQueryKey({ body: { phone_numbers: [] } }) });
      // Remove the user from registeredContacts
      setDisplayedContacts((oldData: User[]) => {
        return oldData.filter((contact: User) => contact.id !== (variables as any)?.body?.target_user_id ?? variables);
      });
    },
  });
};
