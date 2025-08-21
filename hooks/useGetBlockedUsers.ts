
import { getBlockedFriendsOptions } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";

function useGetBlockedUsers() {
  const { data: blockedUsers, isLoading } = useQuery({
    ...getBlockedFriendsOptions(),
  });

  return { blockedUsers, isLoading };
}

export default useGetBlockedUsers;
