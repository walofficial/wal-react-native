import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequestMutation, getFriendRequestsQueryKey, rejectFriendRequestMutation } from "@/lib/api/generated/@tanstack/react-query.gen";

export const useFriendRequestActions = () => {
  const queryClient = useQueryClient();

  const acceptRequest = useMutation({
    onMutate(variables) {
      queryClient.setQueryData(getFriendRequestsQueryKey(), (oldData: any) => {
        if (oldData) {
          return oldData.filter((item: any) => {
            if (item.request.id === variables) {
              return false;
            }
            return true;
          });
        }
      });
    },
    ...acceptFriendRequestMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getFriendRequestsQueryKey() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getFriendRequestsQueryKey() });
    },
  });

  const rejectRequest = useMutation({
    onMutate(variables) {
      queryClient.setQueryData(getFriendRequestsQueryKey(), (oldData: any) => {
        if (oldData) {
          return oldData.filter((item: any) => {
            if (item.request.id === variables) {
              return false;
            }
            return true;
          });
        }
        return oldData;
      });
    },
    ...rejectFriendRequestMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getFriendRequestsQueryKey() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getFriendRequestsQueryKey() });
    },
  });

  return {
    acceptRequest: acceptRequest.mutate,
    rejectRequest: rejectRequest.mutate,
    isAccepting: acceptRequest.isPending,
    isRejecting: rejectRequest.isPending,
  };
};
