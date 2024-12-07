import { useSession } from "@/components/AuthLayer";
import { H1 } from "@/components/ui/typography";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { session, isLoading } = useSession();

  if (session) {
    return <Redirect href="/(tabs)/liveusers" />;
  }
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={"white"} />
      </View>
    );
  }

  return <Redirect href="/sign-in" />;
}
