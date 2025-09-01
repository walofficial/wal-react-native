import {
  getFriendsListQueryKey,
  removeFriendMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteFriendMutation() {
  const queryClient = useQueryClient();

  const deleteFriendMutation = useMutation({
    ...removeFriendMutation(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getFriendsListQueryKey() });
      // queryClient.invalidateQueries({ queryKey: ["registeredContacts"] });
      // queryClient.invalidateQueries({ queryKey: ["registeredContacts", 600] });
    },
  });

  return deleteFriendMutation;
}

export default useDeleteFriendMutation;
