import "~/global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { Slot, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "~/components/primitives/portal";
import AuthLayer, { useSession } from "@/components/AuthLayer";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { createStore, Provider } from "jotai";
import { isDev } from "@/lib/api/config";
import AppStateHandler from "../components/AppStateHandler";
import CustomToast from "@/components/CustomToast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Updates from "expo-updates";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SheetProvider } from "react-native-actions-sheet";

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.dark,
};

export const myStore = createStore();
import "react-native-get-random-values";
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

Sentry.init({
  enabled: !isDev,
  dsn: "https://8e8adf1963b62dfff57f9484ba1028f9@o4506526616453120.ingest.us.sentry.io/4507883615092736",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient();

export default Sentry.wrap(function RootLayout() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "dark";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [router]);

  const { isUpdateAvailable, isUpdatePending, isChecking } =
    Updates.useUpdates();
  const [updateCheckRequested, setUpdateCheckRequested] = useState(false);

  useEffect(() => {
    Updates.checkForUpdateAsync().catch((_error) => {});
  }, []);

  useEffect(() => {
    if (isChecking && !updateCheckRequested) {
      setUpdateCheckRequested(true);
    }
  }, [isChecking, updateCheckRequested]);

  useEffect(() => {
    if (isUpdateAvailable) {
      Updates.fetchUpdateAsync().catch((_error) => {});
    } else if (isUpdateAvailable) {
      // You can also call this inside a modal with an "Update now" button for better UX
      Updates.fetchUpdateAsync().catch((_error) => {});
    }
  }, [isUpdateAvailable]);

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync().catch((_error) => {});
    }
  }, [isUpdatePending]);

  if (!isColorSchemeLoaded) {
    return null;
  }
  // You can keep the splash screen open, or render a loading screen like we do here.

  return (
    <AuthLayer>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DARK_THEME}>
          <StatusBar style={"light"} />
          <GestureHandlerRootView
            style={{
              flex: 1,
            }}
          >
            <Provider store={myStore}>
              <SheetProvider>
                <Slot />
                <AppStateHandler />
              </SheetProvider>
            </Provider>
            <CustomToast />
          </GestureHandlerRootView>

          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthLayer>
  );
});
