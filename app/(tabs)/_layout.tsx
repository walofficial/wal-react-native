import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BackHandler } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useColorScheme } from '@/lib/useColorScheme';
import { isUserRegistered, useSession } from '@/components/AuthLayer';
import DbUserGetter from '@/components/DbUserGetter';
import SidebarLayout from '@/components/SidebarLayout';
import { isAndroid, isWeb } from '@/lib/platform';
import LocationProvider from '@/components/LocationProvider';
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
import { useSetAtom } from 'jotai';
import { factCheckBottomSheetState } from '@/lib/atoms/news';
import { locationUserListSheetState } from '@/lib/atoms/location';
export default function TabLayout() {
  const pathname = usePathname();
  const isRecord = pathname.includes('record');
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

  const recordingTabStyles = {
    tabBarButton: () => null,
    tabBarButtonComponent: () => null,
    tabBarLabel: () => null,
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
        router.navigate({
          pathname: `/(tabs)/(fact-check)/[feedId]/create-post-shareintent`,
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

  // Navigate to news feed on sign in basically.
  useEffect(() => {
    if (
      user?.preferred_news_feed_id &&
      newsFeedId &&
      !userIsLoading &&
      !isLoading
    ) {
      // Only navigate if we're not already on the news feed
      const isOnNewsFeed =
        pathname.includes('(news)') && pathname.includes(newsFeedId);
      if (!isOnNewsFeed) {
        router.navigate({
          pathname: '/(tabs)/(news)/[feedId]',
          params: {
            feedId: user.preferred_news_feed_id,
          },
        });
      }
    }
  }, [user?.preferred_news_feed_id, newsFeedId, userIsLoading, isLoading]);

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
        <DbUserGetter>
          <LocationProvider>
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
          </LocationProvider>
        </DbUserGetter>
      </SidebarLayout>
    );
  }

  // Otherwise, default to existing tabs on mobile.
  return (
    <DbUserGetter>
      <ReactionsOverlayProvider>
        <HeaderTransformProvider>
          <BottomSheetModalProvider>
            <Tabs
              initialRouteName={`(news)`}
              backBehavior="initialRoute"
              screenOptions={{
                lazy: true,
                header: () => null,
                freezeOnBlur: true,
                headerTransparent: true,
                ...(isRecord && recordingTabStyles),
                tabBarActiveTintColor: TAB_COLORS.active,
                tabBarInactiveTintColor: TAB_COLORS.inactive,
                tabBarShowLabel: false,
                tabBarStyle: {
                  backgroundColor: theme.colors.background,
                  borderTopColor: theme.colors.border,
                },
                // tabBarHideOnKeyboard: isIOS,
              }}
            >
              <Tabs.Screen
                name="(home)"
                options={{
                  tabBarLabelStyle: {
                    fontSize: 18,
                  },
                  tabBarIcon: ({ color, focused }) => (
                    <TabBarIcon
                      size={24}
                      name={focused ? 'location' : 'location-outline'}
                      color={focused ? TAB_COLORS.active : TAB_COLORS.inactive}
                      style={
                        focused ? { transform: [{ scale: 1.15 }] } : undefined
                      }
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="(news)"
                options={{
                  href: newsFeedId
                    ? {
                        pathname: '/(tabs)/(news)/[feedId]',
                        params: {
                          feedId: newsFeedId,
                        },
                      }
                    : null,
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
                options={{
                  href: factCheckFeedId
                    ? {
                        pathname: '/(tabs)/(fact-check)/[feedId]',
                        params: {
                          feedId: factCheckFeedId,
                        },
                      }
                    : null,
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
                name="(user)"
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
          </BottomSheetModalProvider>
        </HeaderTransformProvider>
      </ReactionsOverlayProvider>
    </DbUserGetter>
  );
}
