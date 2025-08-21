import useCountAnonList from "./useCountAnonList";
import { Text } from "../ui/text";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";

function LiveUserCountIndicator({ feedId }: { feedId: string }) {
  const { data, isFetching, isRefetching, isSuccess, isError } =
    useCountAnonList(feedId);
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  const standardIcon = (
    <Ionicons name="people-circle-outline" size={25} color="deeppink" />
  );
  if (isFetching && !isRefetching)
    return <ActivityIndicator color={isDarkColorScheme ? "white" : "black"} />;
  if (!isSuccess) return standardIcon;
  return (
    <View style={styles.container}>
      {standardIcon}
      <View style={styles.badge}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {data?.count || 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "500", // Medium weight for better legibility
    letterSpacing: 0.24, // Subtle letter spacing for improved readability
  },
});

export default LiveUserCountIndicator;
