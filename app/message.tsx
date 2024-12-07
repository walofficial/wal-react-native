import { View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useAtom } from "jotai";
import { firebaseRemoteConfigState } from "@/lib/state/storage";
import { Redirect, useRouter } from "expo-router";
import { H1 } from "@/components/ui/typography";
import { isDev } from "@/lib/api/config";

export default function RemoteConfigMessage() {
  const remoteConfigData = useAtom(firebaseRemoteConfigState);
  const insets = useSafeAreaInsets();

  if (isDev) return <Redirect href="/sign-in" />;

  if (!remoteConfigData) return <Redirect href="/sign-in" />;

  if (remoteConfigData.length && !remoteConfigData[0])
    return <Redirect href="/sign-in" />;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View className="flex-1 items-center justify-between p-20">
        <View className="p-4 text-center rounded-lg">
          <H1 className="text-center mb-5">MNT</H1>
          <Text className="text-white text-center text-xl font-bold mb-4">
            {remoteConfigData[0].message}
          </Text>
        </View>
      </View>
    </View>
  );
}
