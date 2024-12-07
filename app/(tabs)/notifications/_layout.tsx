import { Stack, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import ChatTopbar from "@/components/Chat/chat-topbar";

export default function Layout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isMediaPage = pathname.includes("mediapage");

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: Platform.OS === "android" ? insets.top : 0,
      }}
    >
      <Stack screenOptions={{ animation: isMediaPage ? "none" : "default" }}>
        {/* Optionally configure static options outside the route.*/}
        <Stack.Screen
          name="index"
          options={{
            title: "შეტყობინებები",
          }}
        />
        <Stack.Screen
          name="chat/[roomId]/profile-picture"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
            header: () => null,
            title: "",
          }}
        />
        <Stack.Screen
          name="post/[verificationId]"
          options={{
            presentation:
              Platform.OS === "android" ? "modal" : "containedModal",
            animation: "fade",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="post/verification/[verificationId]"
          options={{
            headerTitle: "ფოსტი",
            headerBackTitle: "უკან",
          }}
        />
        <Stack.Screen
          name="chat/[roomId]/index"
          options={{
            title: "ჩათი",
            header: () => (
              <ChatTopbar pictureUrl="(tabs)/notifications/chat/[roomId]/profile-picture" />
            ),
            headerTransparent: true,
          }}
        />
      </Stack>
    </View>
  );
}
