import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import ProfileHeader from "@/components/ProfileHeader";
import { H3 } from "@/components/ui/typography";
import useAuth from "@/hooks/useAuth";
import { Link, Stack } from "expo-router";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Layout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? insets.top : 0,
      }}
    >
      <Stack
        screenOptions={{
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTransparent: true,
            header: () => (
              <ProfileHeader
                customTitleComponent={
                  <H3 className=" pb-3 pt-0 pl-3">{user?.username || "MNT"}</H3>
                }
                customButtons={
                  <Link href={"/(tabs)/user/settings"} asChild>
                    <TouchableOpacity className="flex mb-5 flex-row items-center">
                      <View>
                        <TabBarIcon color="gray" name="settings-outline" />
                      </View>
                    </TouchableOpacity>
                  </Link>
                }
              />
            ),
          }}
        />
        <Stack.Screen
          name="verification/[verificationId]"
          options={{
            presentation:
              Platform.OS === "android" ? "modal" : "containedModal",
            animation: "fade",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="approval/[verificationId]"
          options={{
            presentation:
              Platform.OS === "android" ? "modal" : "fullScreenModal",
            animation: "fade",
            headerShown: false,
          }}
        />
        <Stack.Screen name="completed" options={{ title: "შესრულებული" }} />
        <Stack.Screen name="change-photo" options={{ title: "შეცვალე ფოტო" }} />
        <Stack.Screen name="profile-settings" options={{ title: "პროფილი" }} />
        <Stack.Screen name="blocked-users" options={{ title: "დაბლოკილი" }} />
        <Stack.Screen name="settings" options={{ title: "პარამეტრები" }} />
      </Stack>
    </View>
  );
}
