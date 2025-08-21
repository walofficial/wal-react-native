import { View } from "react-native";

import HomePage from "@/components/HomePage";
import { isUserRegistered, useSession } from "@/components/AuthLayer";
import { Redirect } from "expo-router";
export default function SignIn() {
  const { user } = useSession();

  if (user && isUserRegistered(user)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <HomePage />
    </View>
  );
}
