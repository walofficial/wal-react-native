import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, Stack, useNavigationContainerRef } from 'expo-router';
import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { PortalHost } from '@/components/primitives/portal';
import AuthLayer from '@/components/AuthLayer';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { createStore, Provider, useAtom } from 'jotai';
import { isDev, SENTRY_DSN } from '@/lib/api/config';
import AppStateHandler from '../components/AppStateHandler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { OnboardingProvider } from '@/hooks/useOnboardingContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider as LightboxStateProvider } from '@/lib/lightbox/lightbox';
import '@/lib/init_livekit';
import { ShareIntentProvider } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/lib/theme';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { appLocaleAtom } from '@/hooks/useAppLocalization';
import { getCurrentLocale, setLocale } from '@/lib/i18n';
import StatusBarRenderer from '@/components/StatusBarRenderer';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { useSyncQueriesExternal } from 'react-query-external-sync';
import * as ExpoDevice from 'expo-device';
import * as NavigationBar from 'expo-navigation-bar';

function AppLocaleGate({ children }: { children: React.ReactNode }) {
  const navigationRef = useNavigationContainerRef();

  useReactNavigationDevTools(navigationRef);

  const [appLocale, setAppLocale] = useAtom(appLocaleAtom);

  useEffect(() => {
    (async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('app-locale');
        const initialLocale = storedLocale || getCurrentLocale();
        if (!appLocale) {
          setAppLocale(initialLocale);
        }
        setLocale(initialLocale);
      } catch {
        const fallback = getCurrentLocale();
        setLocale(fallback);
        if (!appLocale) setAppLocale(fallback);
      }
    })();
  }, []);

  useEffect(() => {
    if (appLocale) {
      setLocale(appLocale);
    }
  }, [appLocale]);

  return (
    <React.Fragment key={appLocale || 'default'}>{children}</React.Fragment>
  );
}

export const myStore = createStore();
import 'react-native-get-random-values';
import { appIsReadyState } from '@/lib/state/app';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
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
  dsn: SENTRY_DSN,

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

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { Lightbox } from '@/components/Lightbox/Lightbox';
import { ToastProviderWithViewport } from '@/components/ToastUsage';
import LocationProvider from '@/components/LocationProvider';
import Constants from 'expo-constants';
import SimplifiedVideoPlayback from '@/components/SimplifiedVideoPlayback';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
// Import Platform for React Native or use other platform detection for web/desktop

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});
// Get the host IP address dynamically
const hostIP =
  Constants.expoGoConfig?.debuggerHost?.split(`:`)[0] ||
  Constants.expoConfig?.hostUri?.split(`:`)[0];

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useAtom(appIsReadyState);
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  // Initialize and keep app localization in sync
  const [appLocale, setAppLocale] = useAtom(appLocaleAtom);

  // Create your query client
  // Set up the sync hook - automatically disabled in production!
  // useSyncQueriesExternal({
  //   queryClient,
  //   socketURL: `http://${hostIP}:42831`, // Use local network IP
  //   // Default port for React Native DevTools
  //   deviceName: Platform?.OS || 'web', // Platform detection
  //   platform: Platform?.OS || 'web', // Use appropriate platform identifier
  //   deviceId: Platform?.OS || 'web', // Use a PERSISTENT identifier (see note below)
  //   isDevice: ExpoDevice.isDevice, // Automatically detects real devices vs emulators
  //   extraDeviceInfo: {
  //     // Optional additional info about your device
  //     appVersion: '1.0.0',
  //     // Add any relevant platform info
  //   },
  //   enableLogs: true,
  //   envVariables: {
  //     NODE_ENV: process.env.NODE_ENV,
  //     // Add any private environment variables you want to monitor
  //     // Public environment variables are automatically loaded
  //   },
  //   // Storage monitoring with CRUD operations
  //   asyncStorage: AsyncStorage, // AsyncStorage for ['#storage', 'async', 'key'] queries + monitoring
  //   secureStorageKeys: [
  //     'userToken',
  //     'refreshToken',
  //     'biometricKey',
  //     'deviceId',
  //   ], // SecureStore keys to monitor
  // });
  // Use the new OTA updates hook
  useOTAUpdates();
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, [appIsReady]);

  // Initialize locale from storage/device on first mount
  useEffect(() => {
    (async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('app-locale');
        const initialLocale = storedLocale || getCurrentLocale();
        if (!appLocale) {
          setAppLocale(initialLocale);
        }
        setLocale(initialLocale);
      } catch {
        const fallback = getCurrentLocale();
        setLocale(fallback);
        if (!appLocale) setAppLocale(fallback);
      }
    })();
  }, []);

  // React to locale changes
  useEffect(() => {
    if (appLocale) {
      setLocale(appLocale);
    }
  }, [appLocale]);

  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);

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
                colorScheme === 'dark'
                  ? {
                      ...DarkTheme,
                      colors: { ...NAV_THEME.dark, background: '#000' },
                    }
                  : {
                      ...DefaultTheme,
                      colors: {
                        ...DefaultTheme.colors,
                        background: '#efefef',
                      },
                    }
              }
            >
              <ThemeProvider>
                <ToastProviderWithViewport>
                  <Provider store={myStore}>
                    <AppLocaleGate>
                      <LocationProvider>
                        <AuthLayer>
                          <GestureHandlerRootView
                            key={appLocale || 'default'}
                            style={{
                              flex: 1,
                              backgroundColor: theme.colors.background,
                            }}
                          >
                            <ShareIntentProvider
                              options={{
                                debug: false,
                                resetOnBackground: true,
                              }}
                            >
                              <Stack initialRouteName="index">
                                <Stack.Screen
                                  name="(camera)"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(tabs)"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(auth)"
                                  options={{
                                    headerShown: false,
                                    animation: 'fade',
                                    contentStyle: { backgroundColor: 'black' },
                                  }}
                                />
                                <Stack.Screen
                                  name="status/[verificationId]"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="index"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(chat)"
                                  options={{ headerShown: false }}
                                />
                              </Stack>
                              <AppStateHandler />
                            </ShareIntentProvider>
                            <StatusBarRenderer />
                            <Lightbox />
                            <PortalHost />
                          </GestureHandlerRootView>
                        </AuthLayer>
                      </LocationProvider>
                    </AppLocaleGate>
                  </Provider>
                </ToastProviderWithViewport>
              </ThemeProvider>
            </NavigationThemeProvider>
          </LightboxStateProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </OnboardingProvider>
  );
}
