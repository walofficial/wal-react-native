import { Text, StyleSheet } from "react-native";
import { useUnreadCount } from "@/hooks/useUnreadCount";

function UnreadCount() {
  const { unreadCount, isLoading } = useUnreadCount();

  if (isLoading || unreadCount === 0) return null;

  return <Text style={styles.text}>{unreadCount}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UnreadCount;
