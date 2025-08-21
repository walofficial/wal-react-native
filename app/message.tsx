import { View, StyleSheet } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useAtom } from "jotai";
import { firebaseRemoteConfigState } from "@/lib/state/storage";
import { Redirect } from "expo-router";
import { H1 } from "@/components/ui/typography";
import { isDev } from "@/lib/api/config";

export default function RemoteConfigMessage() {
  const remoteConfigData = useAtom(firebaseRemoteConfigState);
  const insets = useSafeAreaInsets();

  // if (isDev) return <Redirect href="/(auth)/sign-in" />;

  if (!remoteConfigData) return <Redirect href="/(auth)/sign-in" />;

  if (remoteConfigData.length && !remoteConfigData[0])
    return <Redirect href="/(auth)/sign-in" />;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.messageContainer}>
          <H1 style={styles.title}>WAL</H1>
          <Text style={styles.message}>
            {(remoteConfigData[0] as any)?.message ?? "გამარჯობა"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  messageContainer: {
    padding: 16,
    textAlign: "center",
    borderRadius: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  message: {
    color: "white",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
