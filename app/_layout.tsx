import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "~/components/primitives/portal";
import AuthLayer, { useSession } from "@/components/AuthLayer";
import * as Notifications from "expo-notifications";
import * as Sentry from "@sentry/react-native";
import { createStore, Provider, useAtom } from "jotai";
import { isDev } from "@/lib/api/config";
import AppStateHandler from "../components/AppStateHandler";
import CustomToast from "@/components/CustomToast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { useOTAUpdates } from "@/hooks/useOTAUpdates";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { OnboardingProvider } from "@/hooks/useOnboardingContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as LightboxStateProvider } from "@/lib/lightbox/lightbox";
import "@/lib/init_livekit";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useTheme } from "@/lib/theme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";

export const myStore = createStore();
import "react-native-get-random-values";
import { appIsReadyState } from "@/lib/state/app";
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

//Sentry
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});
Sentry.init({
  enabled: !isDev,
  dsn: "https://8e8adf1963b62dfff57f9484ba1028f9@o4506526616453120.ingest.us.sentry.io/4507883615092736",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // NOTE
      // refetchOnWindowFocus breaks some UIs (like feeds)
      // so we only selectively want to enable this
      // -prf
      refetchOnWindowFocus: false,
      // Structural sharing between responses makes it impossible to rely on
      // "first seen" timestamps on objects to determine if they're fresh.
      // Disable this optimization so that we can rely on "first seen" timestamps.
      structuralSharing: false,
      // We don't want to retry queries by default, because in most cases we
      // want to fail early and show a response to the user. There are
      // exceptions, and those can be made on a per-query basis. For others, we
      // should give users controls to retry.
      retry: false,
    },
  },
});

import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { Lightbox } from "@/components/Lightbox/Lightbox";

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useAtom(appIsReadyState);
  const theme = useTheme();
  const { colorScheme } = useColorScheme();

  // Use the new OTA updates hook
  useOTAUpdates();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, [appIsReady]);

  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);
  // You can keep the splash screen open, or render a loading screen like we do here.
  return (
    <OnboardingProvider>
      <KeyboardProvider enabled={true} statusBarTranslucent={true}>
        <QueryClientProvider client={queryClient}>
          <LightboxStateProvider>
            <NavigationThemeProvider
              value={
                colorScheme === "dark"
                  ? {
                      ...DarkTheme,
                      colors: { ...NAV_THEME.dark, background: "#000" },
                    }
                  : {
                      ...DefaultTheme,
                      colors: { ...DefaultTheme.colors, background: "#efefef" },
                    }
              }
            >
              <ThemeProvider>
                <AuthLayer>
                  <GestureHandlerRootView
                    style={{
                      flex: 1,
                      backgroundColor: theme.colors.background,
                    }}
                  >
                    <Provider store={myStore}>
                      <ShareIntentProvider
                        options={{
                          debug: false,
                          resetOnBackground: true,
                        }}
                      >
                        <Slot />
                        <AppStateHandler />
                      </ShareIntentProvider>
                    </Provider>
                    <CustomToast />
                    {Platform.OS === "android" && (
                      <StatusBar
                        backgroundColor={
                          colorScheme === "dark" ? "black" : "#efefef"
                        }
                        style={colorScheme === "dark" ? "light" : "dark"}
                      />
                    )}
                    <Lightbox />
                  </GestureHandlerRootView>

                  <PortalHost />
                </AuthLayer>
              </ThemeProvider>
            </NavigationThemeProvider>
          </LightboxStateProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </OnboardingProvider>
  );
}
