import api from "@/lib/api";
import { FriendFeedItem } from "@/lib/interfaces";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

function useDeleteFriendMutation() {
  const deleteFriendMutation = useMutation({
    mutationFn: api.deleteFriend,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["registeredContacts"] });
      queryClient.invalidateQueries({ queryKey: ["registeredContacts", 600] });
      queryClient.setQueryData(["friendsFeed"], (data: any) => {
        return {
          ...data,
          pages: data.pages.map((page: FriendFeedItem[]) =>
            page.filter((user: FriendFeedItem) => user.user.id !== variables)
          ),
        };
      });
    },
  });

  return deleteFriendMutation;
}

export default useDeleteFriendMutation;
