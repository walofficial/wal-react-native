import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useUnreadCount() {
  const { data, isLoading } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const response = await api.getUnreadNotificationsCount();
      return response.count;
    },
    refetchInterval: 15000, // Refetch every 10 seconds
  });

  return {
    unreadCount: data ?? 0,
    isLoading,
  };
}
