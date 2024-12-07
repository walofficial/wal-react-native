import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useFriendRequestActions = () => {
  const queryClient = useQueryClient();

  const acceptRequest = useMutation({
    onMutate(variables) {
      queryClient.setQueryData(["friendRequests"], (oldData: any) => {
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
    mutationFn: api.acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friendsFeed"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const rejectRequest = useMutation({
    onMutate(variables) {
      queryClient.setQueryData(["friendRequests"], (oldData: any) => {
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
    mutationFn: api.rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  return {
    acceptRequest: acceptRequest.mutate,
    rejectRequest: rejectRequest.mutate,
    isAccepting: acceptRequest.isPending,
    isRejecting: rejectRequest.isPending,
  };
};
