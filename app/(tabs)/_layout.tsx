import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BackHandler, StyleSheet, View } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useColorScheme } from '@/lib/useColorScheme';
import { isUserRegistered, useSession } from '@/components/AuthLayer';
import DbUserGetter from '@/components/DbUserGetter';
import SidebarLayout from '@/components/SidebarLayout';
import { isAndroid, isWeb } from '@/lib/platform';
import useFeeds from '@/hooks/useFeeds';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { useShareIntentContext } from 'expo-share-intent';
import ErrorMessageCard from '@/components/ErrorMessageCard';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useTheme } from '@/lib/theme';
import { trackScreen, setUserProperties } from '@/lib/analytics';
import { getCurrentLocale } from '@/lib/i18n';
import { setAndroidNavigationBar } from '@/lib/android-navigation-bar';
import { Provider as HeaderTransformProvider } from '@/lib/context/header-transform';
import { Provider as ReactionsOverlayProvider } from '@/lib/reactionsOverlay/reactionsOverlay';
import { ReactionsOverlay } from '@/components/ReactionsOverlay/ReactionsOverlay';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { factCheckBottomSheetState } from '@/lib/atoms/news';
import { locationUserListSheetState } from '@/lib/atoms/location';
import { isUserLiveState } from '@/components/CameraPage/atom';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { activeLivekitRoomState } from '@/components/SpacesBottomSheet/atom';
import SpacesBottomSheet from '@/components/SpacesBottomSheet';

function LivePulseIcon({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 900 }),
        withTiming(0.6, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <View style={styles.iconInner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,0,0.25)',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function TabLayout() {
  const pathname = usePathname();
  const { factCheckFeedId, newsFeedId } = useFeeds();
  const { isDarkColorScheme } = useColorScheme();
  // Track screen changes and update user properties
  useEffect(() => {
    const screenName = pathname.replace('/', '').split('?')[0] || 'root';
    trackScreen(screenName, 'TabsLayout');
    setUserProperties({
      app_language: getCurrentLocale?.() || 'en',
    });
  }, [pathname]);

  const theme = useTheme();
  // Theme-aware tab colors
  const TAB_COLORS = {
    active: isDarkColorScheme ? '#FFFFFF' : '#121212', // White in dark mode, near black in light mode
    inactive: isDarkColorScheme ? '#777777' : '#999999', // Dark gray in dark mode, lighter gray in light mode
  };

  const { colorScheme } = useColorScheme();

  useEffect(() => {
    setAndroidNavigationBar(colorScheme);
  }, [colorScheme]);

  const { session, isLoading, user, userIsLoading } = useSession();

  const { closeLightbox } = useLightboxControls();
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  const setUserLocationBottomSheet = useSetAtom(locationUserListSheetState);
  const setIsFactCheckBottomSheetOpen = useSetAtom(factCheckBottomSheetState);
  const isUserLive = useAtomValue(isUserLiveState);
  useEffect(() => {
    if (shareIntent && session && isAndroid) {
      // Check if we have images or text content to share
      const hasContent =
        shareIntent.text || (shareIntent.files && shareIntent.files.length > 0);

      if (hasContent) {
        // Filter for image files if any
        const imageFiles =
          shareIntent.files?.filter(
            (file) =>
              file.mimeType?.startsWith('image/') ||
              file.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i),
          ) || [];

        // Convert share intent files to the format expected by create-post
        const convertedImages = imageFiles.map((file) => ({
          uri: file.path,
          width: file.width || 0,
          height: file.height || 0,
          fileSize: file.size,
          type: 'image' as const,
          fileName: file.fileName || `shared_image_${Date.now()}.jpg`,
          mimeType: file.mimeType || 'image/jpeg',
          exif: null,
          assetId: null,
          base64: null,
          duration: null,
        }));

        // Encode the images as URL parameters if we have any
        const encodedImages =
          convertedImages.length > 0
            ? encodeURIComponent(JSON.stringify(convertedImages))
            : '';

        // Build navigation params
        const params: any = {
          feedId: factCheckFeedId,
          disableRoomCreation: 'true',
        };

        if (shareIntent.text) {
          params.sharedContent = shareIntent.text;
        }

        if (encodedImages) {
          params.sharedImages = encodedImages;
        }

        setUserLocationBottomSheet(false);
        setIsFactCheckBottomSheetOpen(false);

        // Navigate to create-post-shareintent for any shared content (text or images)
        router.push({
          pathname: `/(tabs)/(fact-check)/create-post`,
          params,
        });
      }

      resetShareIntent();
    }
  }, [shareIntent, session]);

  useEffect(() => {
    if (isAndroid) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        return closeLightbox();
      });

      return () => {
        listener.remove();
      };
    }
  }, [pathname]);
  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return null;
  }
  // // Only require authentication within the (app) group's layout as users
  // // need to be able to access the (auth) group and sign in again.
  if (!session && !isWeb) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.

    // Using (auth) groups is necessary to avoid infinite redirect loop

    return <Redirect href="/(auth)/sign-in" />;
  }
  // Order here is important, if we don't have user info we show loader, user might be registered or not

  if (userIsLoading) {
    return <FullScreenLoader />;
  }
  // once we got user, check if registered
  if (user && !isUserRegistered(user)) {
    return <Redirect href="/(auth)/register" />;
  }
  // If we dont have user show error message, because seeing tabs layout without user shouldn't be possible
  if (!user && !isWeb) {
    return (
      <ErrorMessageCard
        title="დაფიქსირდა შეცდომა"
        description="გთხოვთ სცადოთ მოგვიანებით ან სცადეთ ხელახლა"
      />
    );
  }

  // ---------------------------
  // NEW PLATFORM HANDLING
  // ---------------------------
  if (isWeb) {
    // If on web, show a completely different layout with sidebar
    return (
      <SidebarLayout>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: {
                backgroundColor: 'transparent',
              },
              contentStyle: {
                backgroundColor: theme.colors.background,
              },
            }}
          />
        </BottomSheetModalProvider>
      </SidebarLayout>
    );
  }
  // Otherwise, default to existing tabs on mobile.
  return (
    <DbUserGetter showMessagePreview={true}>
      <ReactionsOverlayProvider>
        <HeaderTransformProvider>
          <BottomSheetModalProvider>
            <Tabs
              backBehavior="initialRoute"
              screenOptions={{
                lazy: true,
                header: () => null,
                freezeOnBlur: true,
                headerTransparent: true,
                tabBarActiveTintColor: TAB_COLORS.active,
                tabBarInactiveTintColor: TAB_COLORS.inactive,
                tabBarShowLabel: false,
                tabBarStyle: {
                  backgroundColor: theme.colors.background,
                  borderTopColor: theme.colors.border,
                },
              }}
            >
              <Tabs.Screen
                name="(news)"
                listeners={() => ({
                  tabPress: (e) => {
                    if (router.canGoBack()) {
                      router.dismissAll();
                    }
                  },
                })}
                initialParams={{
                  feedId: newsFeedId,
                }}
                options={{
                  tabBarIcon: ({ color, focused }) => (
                    <TabBarIcon
                      size={24}
                      name={focused ? 'newspaper' : 'newspaper-outline'}
                      color={focused ? TAB_COLORS.active : TAB_COLORS.inactive}
                      // style={
                      //   focused ? { transform: [{ scale: 1.15 }] } : undefined
                      // }
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="(fact-check)"
                listeners={() => ({
                  tabPress: (e) => {
                    if (router.canGoBack()) {
                      router.dismissAll();
                    }
                  },
                })}
                initialParams={{
                  content_type: 'last24h',
                  feedId: factCheckFeedId,
                }}
                options={{
                  tabBarIcon: ({ color, focused }) => (
                    <TabBarIcon
                      size={24}
                      name={
                        focused
                          ? 'shield-checkmark'
                          : 'shield-checkmark-outline'
                      }
                      color={focused ? TAB_COLORS.active : TAB_COLORS.inactive}
                      // style={
                      //   focused ? { transform: [{ scale: 1.15 }] } : undefined
                      // }
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="(home)"
                // listeners={() => ({
                //   tabPress: (e) => {
                //     if (router.canGoBack()) {
                //       router.dismissAll();
                //     }
                //   },
                // })}
                options={{
                  tabBarLabelStyle: {
                    fontSize: 18,
                  },
                  tabBarIcon: ({ color, focused }) =>
                    isUserLive ? (
                      <LivePulseIcon>
                        <TabBarIcon size={24} name="radio" color="#FF0000" />
                      </LivePulseIcon>
                    ) : (
                      <TabBarIcon
                        size={24}
                        name={focused ? 'location' : 'location-outline'}
                        color={
                          focused ? TAB_COLORS.active : TAB_COLORS.inactive
                        }
                        style={
                          focused ? { transform: [{ scale: 1.15 }] } : undefined
                        }
                      />
                    ),
                }}
              />
              <Tabs.Screen
                name="(chat-list)"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <TabBarIcon
                      size={24}
                      name={focused ? 'chatbubble' : 'chatbubble-outline'}
                      color={focused ? TAB_COLORS.active : TAB_COLORS.inactive}
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="(user)"
                listeners={() => ({
                  tabPress: (e) => {
                    if (router.canGoBack()) {
                      router.dismissAll();
                      router.navigate({
                        pathname: '/(tabs)/(user)',
                      });
                    }
                  },
                })}
                options={{
                  title: '',
                  tabBarIcon: ({ color, focused }) => (
                    <TabBarIcon
                      size={24}
                      name={focused ? 'person-circle' : 'person-circle'}
                      color={focused ? TAB_COLORS.active : TAB_COLORS.inactive}
                      style={
                        focused ? { transform: [{ scale: 1.15 }] } : undefined
                      }
                    />
                  ),
                }}
              />

              <Tabs.Screen
                name="shareintent"
                options={{
                  href: null,
                }}
              />
            </Tabs>
            <ReactionsOverlay />
            <SpacesBottomSheet />
          </BottomSheetModalProvider>
        </HeaderTransformProvider>
      </ReactionsOverlayProvider>
    </DbUserGetter>
  );
}
