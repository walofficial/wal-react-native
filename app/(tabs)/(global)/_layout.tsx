import React from "react";
import { Link, Stack, usePathname } from "expo-router";
import ProfileHeader from "@/components/ProfileHeader";
import { CustomTitle, CustomTitleWithText } from "@/components/CustomTitle";
import { ScrollReanimatedValueProvider } from "@/components/context/ScrollReanimatedValue";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatTopbar from "@/components/Chat/chat-topbar";
import { isIOS, isWeb } from "@/lib/platform";
import SimpleGoBackHeader from "@/components/SimpleGoBackHeader";
import SimpleGoBackHeaderPost from "@/components/SimpleGoBackHeaderPost";
import { ProfilePageUsername } from "@/components/ProfilePageUsername";

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, flex: 1 }}>
      <ScrollReanimatedValueProvider>
        <Stack
          screenOptions={{
            headerBackVisible: true,
            headerBackTitle: isWeb ? "უკან" : undefined,
          }}
        >
          <Stack.Screen
            name="[taskId]/index"
            options={{
              title: "",
              headerTransparent: !isWeb,
              header: () => (
                <ProfileHeader
                  isAnimated
                  customTitleComponent={<CustomTitle />}
                  showSearch={true}
                />
              ),
            }}
          />
          <Stack.Screen
            name="[taskId]/create-post"
            options={{
              presentation: isIOS ? "modal" : "card",
              animation: isIOS ? "slide_from_bottom" : "fade_from_bottom",
              animationDuration: 200,
              header: () => null,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="[taskId]/create-post-shareintent"
            options={{
              header: () => null,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile-picture"
            options={{
              headerTransparent: true,
              header: () => <SimpleGoBackHeader title="ფოტო" />,
            }}
          />

          <Stack.Screen
            name="notifications"
            options={{
              title: "შეტყობინებები",
              headerStyle: {
                backgroundColor: "black",
              },
            }}
          />
          <Stack.Screen
            name="chatrooms/index"
            options={{
              header: () => <SimpleGoBackHeader title="ჩათი" />,
            }}
          />

          <Stack.Screen
            name="chatrooms/[roomId]/index"
            options={{
              headerTransparent: true,
              header: () => <ChatTopbar />,
            }}
          />

          <Stack.Screen
            name="profile"
            options={{
              headerTransparent: true,
              header: () => <ProfilePageUsername />,
            }}
          />

          <Stack.Screen
            name="verification/[verificationId]"
            options={({ route }) => {
              const params = route.params as { verificationId?: string };
              const verificationId = params?.verificationId;
              return {
                title: "",
                headerTransparent: true,
                header: () => {
                  return (
                    <SimpleGoBackHeaderPost
                      verificationId={verificationId || ""}
                    />
                  );
                },
              };
            }}
          />

          <Stack.Screen
            name="fact-checks"
            options={{
              headerTransparent: true,
              header: () => <SimpleGoBackHeader title="როგორ მუშაობს?" />,
            }}
          />
        </Stack>
      </ScrollReanimatedValueProvider>
    </View>
  );
}
