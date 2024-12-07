import { Text } from "react-native";
import { useUnreadCount } from "@/hooks/useUnreadCount";

function UnreadCount() {
  const { unreadCount, isLoading } = useUnreadCount();

  if (isLoading || unreadCount === 0) return null;

  return <Text className="text-white text-sm font-medium">{unreadCount}</Text>;
}

export default UnreadCount;
