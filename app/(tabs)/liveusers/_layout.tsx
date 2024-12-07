import { Stack } from "expo-router";
import ProfileHeader from "@/components/ProfileHeader";
import ChatTopbar from "@/components/Chat/chat-topbar";
import CustomTitle from "@/components/CustomTitle";
import { ScrollReanimatedValueProvider } from "@/components/context/ScrollReanimatedValue";
import { Platform } from "react-native";

export default function Layout() {
  return (
    <ScrollReanimatedValueProvider>
      <Stack
        screenOptions={{
          headerBackVisible: true,
          headerBackTitleVisible: false,
          headerTransparent: true,
          header: () => null,
        }}
      >
        {/* Optionally configure static options outside the route.*/}
        <Stack.Screen
          name="feed/index"
          options={{
            headerTransparent: true,
            header: () => <ProfileHeader />,
          }}
        />
        <Stack.Screen
          name="feed/[taskId]/index"
          options={{
            headerTransparent: true,
            header: () => (
              <ProfileHeader customTitleComponent={<CustomTitle />} />
            ),
          }}
        />
        <Stack.Screen
          name="feed/[taskId]/chat/[roomId]/index"
          options={{
            title: "ჩათი",
            header: () => (
              <ChatTopbar pictureUrl="feed/[taskId]/chat/[roomId]/profile-picture" />
            ),
            headerTransparent: true,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/chat/[roomId]/profile-picture"
          options={{
            presentation: "modal",
            header: () => null,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/verification/[verificationId]"
          options={{
            presentation:
              Platform.OS === "android" ? "modal" : "containedModal",
            animation: "fade",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/profile-picture"
          options={{
            presentation: "modal",
            header: () => null,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/record"
          options={{
            header: () => null,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/mediapage"
          options={{
            header: () => null,
          }}
        />

        <Stack.Screen
          name="feed/[taskId]/create-post"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            header: () => null,
          }}
        />
      </Stack>
    </ScrollReanimatedValueProvider>
  );
}
