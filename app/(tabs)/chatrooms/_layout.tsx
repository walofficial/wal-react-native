import { Stack } from "expo-router";
import ChatTopbar from "@/components/Chat/chat-topbar";
import { ScrollReanimatedValueProvider } from "@/components/context/ScrollReanimatedValue";
import { View } from "react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function Layout() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollReanimatedValueProvider>
      <View
        className="flex-1"
        style={{
          paddingTop: Platform.OS === "android" ? insets.top : 0,
        }}
      >
        <Stack screenOptions={{}}>
          <Stack.Screen
            name="index"
            options={{
              title: "ჩათი",
            }}
          />
          <Stack.Screen
            name="chat/[roomId]/index"
            options={{
              title: "ჩათი",
              header: () => (
                <ChatTopbar pictureUrl="/(tabs)/chatrooms/chat/[roomId]/profile-picture" />
              ),
              headerTransparent: true,
            }}
          />

          <Stack.Screen
            name="chat/[roomId]/profile-picture"
            options={{
              presentation: "modal",
              header: () => null,
            }}
          />
        </Stack>
      </View>
    </ScrollReanimatedValueProvider>
  );
}
