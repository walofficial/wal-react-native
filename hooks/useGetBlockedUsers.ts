import api from "@/lib/api";

import { useQuery } from "@tanstack/react-query";

function useGetBlockedUsers() {
  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: api.getBlockedUsers,
  });

  return { blockedUsers, isLoading };
}

export default useGetBlockedUsers;
