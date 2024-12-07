import { Redirect, Tabs, usePathname } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import "@/components/sheets";
import { View } from "react-native";
import { useSession } from "@/components/AuthLayer";
import DbUserGetter from "@/components/DbUserGetter";
import ProfileButton from "@/components/ProfileButton";
import LocationContext from "@/hooks/context";
import useLocation from "@/hooks/useLocation";

function LocationProvider({ children }: { children: React.ReactNode }) {
  const { location } = useLocation();
  return (
    <LocationContext.Provider value={{ location }}>
      {children}
    </LocationContext.Provider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isRecord = pathname.includes("record");

  const recordingTabStyles = {
    tabBarBackground: () => (
      <View className="bg-transparent pointer-events-none" />
    ),
    tabBarStyle: {
      backgroundColor: "rgba(0,0,0,0.5)",
      bottom: 0,
      borderTopWidth: 0,
      elevation: 0, // for Android
      shadowOpacity: 0, // for iOS
      opacity: 0.5,
      pointerEvents: "none",
    },
    tabBarActiveBackgroundColor: "transparent",
    tabBarInactiveBackgroundColor: "transparent",
  };

  const { session, isLoading } = useSession();

  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return null;
  }
  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!session) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/sign-in" />;
  }
  return (
    <DbUserGetter>
      <LocationProvider>
        <Tabs
          initialRouteName="liveusers"
          screenOptions={{
            header: () => null,
            headerTransparent: true,
            ...(isRecord && recordingTabStyles),
            tabBarActiveTintColor: colorScheme === "dark" ? "white" : "black",
            tabBarShowLabel: false,
          }}
        >
          <Tabs.Screen
            name="liveusers"
            options={{
              tabBarLabelStyle: {
                fontSize: 18,
              },
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  size={30}
                  name={focused ? "people-circle" : "people-circle-outline"}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="chatrooms"
            options={{
              title: "ჩათი",
              tabBarLabelStyle: {
                fontSize: 14,
              },
              tabBarButton: () => null,
            }}
          />

          <Tabs.Screen
            name="index"
            options={{
              tabBarButton: () => null,
            }}
          />

          <Tabs.Screen
            name="notifications"
            options={{
              title: "ნოტიფიკაციები",
              tabBarLabelStyle: {
                fontSize: 14,
              },
              tabBarButton: () => null,
            }}
          />

          <Tabs.Screen
            name="user"
            options={{
              title: "პროფილი",
              tabBarIcon: () => <ProfileButton />,
            }}
          />
        </Tabs>
      </LocationProvider>
    </DbUserGetter>
  );
}
