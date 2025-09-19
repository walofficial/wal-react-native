import React from 'react';
import {
  Link,
  Redirect,
  Stack,
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from 'expo-router';
import ProfileHeader from '@/components/ProfileHeader';
import { CustomTitle, TaskTitle } from '@/components/CustomTitle';
import { ScrollReanimatedValueProvider } from '@/components/context/ScrollReanimatedValue';
import {
  View,
  Text,
  Platform,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatTopbar from '@/components/Chat/chat-topbar';
import { isIOS, isWeb } from '@/lib/platform';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import SimpleGoBackHeaderPost from '@/components/SimpleGoBackHeaderPost';
import { ProfilePageUsername } from '@/components/ProfilePageUsername';
import { t } from '@/lib/i18n';
import useGoLive from '@/hooks/useGoLive';
import useFeeds from '@/hooks/useFeeds';
import useLocationsInfo from '@/hooks/useLocationsInfo';
import { useTheme } from '@/lib/theme';
import useTranslation from '@/hooks/useTranslation';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';
import { FontSizes } from '@/lib/theme';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import useAuth from '@/hooks/useAuth';
import LocationProvider from '@/components/LocationProvider';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function Layout({ segment }: { segment: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { categoryId } = useUserFeedIds();
  const { factCheckFeedId, newsFeedId } = useFeeds();
  const isNewsFeed = segment === '(news)';
  const isFactCheckFeed = segment === '(fact-check)';
  const isHomeFeed = segment === '(home)';
  const isUserFeed = segment === '(user)';
  const { user } = useAuth();
  const { feedId: homeFeedId } = useGlobalSearchParams<{ feedId: string }>();
  const theme = useTheme();
  const feedId = isNewsFeed
    ? newsFeedId
    : isFactCheckFeed
      ? factCheckFeedId
      : isHomeFeed
        ? homeFeedId
        : '';
  const screens = [
    <Stack.Screen
      name="profile"
      options={{
        headerTransparent: true,
        header: () => <ProfilePageUsername />,
      }}
    />,

    <Stack.Screen
      name="verification/[verificationId]"
      options={({ route }) => {
        const params = route.params as { verificationId?: string };
        const verificationId = params?.verificationId;
        return {
          title: '',
          headerTransparent: true,
          header: () => {
            return (
              <SimpleGoBackHeaderPost verificationId={verificationId || ''} />
            );
          },
        };
      }}
    />,

    <Stack.Screen
      name="create-post"
      options={{
        presentation: isIOS ? 'modal' : 'card',
        animation: isIOS ? 'slide_from_bottom' : 'fade_from_bottom',
        animationDuration: 200,
        header: () => null,
        headerShown: false,
      }}
    />,
    <Stack.Screen
      name="create-post-shareintent"
      options={{
        header: () => null,
        headerShown: false,
      }}
    />,
    <Stack.Screen
      name="profile-picture"
      options={{
        headerTransparent: true,
        header: () => <SimpleGoBackHeader title="ფოტო" />,
      }}
    />,

    <Stack.Screen
      name="chatrooms/index"
      options={{
        header: () => <SimpleGoBackHeader title="ჩათი" />,
      }}
    />,

    <Stack.Screen
      name="chatrooms/[roomId]/index"
      options={{
        headerTransparent: true,
        header: () => <ChatTopbar />,
      }}
    />,
  ];
  if (isHomeFeed) {
    screens.push(
      <Stack.Screen
        name="[feedId]/index"
        options={{
          headerTransparent: !isWeb,
          animation: 'fade',
          header: () => (
            <ProfileHeader
              feedId={feedId}
              showTabs={true}
              customTitleComponent={<TaskTitle feedId={feedId} />}
              showLocationTabs={true}
            />
          ),
        }}
      />,
    );
  }

  if (!isUserFeed) {
    screens.push(
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerTransparent: !isWeb,
          header: isHomeFeed
            ? undefined
            : () => (
                <ProfileHeader
                  feedId={feedId}
                  isAnimated
                  customTitleComponent={<TaskTitle feedId={feedId} />}
                  showSearch={!isUserFeed}
                  showLocationTabs={!isNewsFeed && !isFactCheckFeed}
                  showTabs={!isNewsFeed && !isUserFeed}
                />
              ),
        }}
      />,
    );
  }

  if (isUserFeed) {
    screens.push(
      <Stack.Screen
        name="index"
        options={{
          title: 'პროფილი',
          headerTransparent: true,
          header: () => (
            <ProfileHeader
              customTitleComponent={
                <CustomTitle text={user?.username || '...'} />
              }
              customButtons={
                <Link href={'/(tabs)/(user)/settings'} asChild>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View>
                      <TabBarIcon
                        color={theme.colors.icon}
                        name="settings-outline"
                      />
                    </View>
                  </TouchableOpacity>
                </Link>
              }
            />
          ),
        }}
      />,
    );
    screens.push(
      <Stack.Screen
        name="change-photo"
        options={{
          title: '',
          headerTransparent: true,
          header: () => <SimpleGoBackHeader title={t('common.change_photo')} />,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />,
      <Stack.Screen
        name="blocked-users"
        options={{
          title: 'დაბლოკილი',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />,
      <Stack.Screen
        name="settings"
        options={{
          title: '',
          headerTransparent: true,
          header: () => <SimpleGoBackHeader title={t('common.settings')} />,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />,

      <Stack.Screen
        name="profile-settings"
        options={{
          title: '',
          headerShown: false,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />,
      <Stack.Screen
        name="language-region"
        options={{
          title: '',
          headerTransparent: true,
          header: () => (
            <SimpleGoBackHeader title={t('settings.language_and_region')} />
          ),
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      />,
    );
  }

  if (isHomeFeed) {
    return (
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <ScrollReanimatedValueProvider>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerBackVisible: true,
              headerBackTitle: isWeb ? 'უკან' : undefined,
            }}
          >
            {screens}
          </Stack>
        </ScrollReanimatedValueProvider>
      </View>
    );
  }
  return (
    <View style={{ paddingTop: insets.top, flex: 1 }}>
      <ScrollReanimatedValueProvider>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerBackVisible: true,
            headerBackTitle: isWeb ? 'უკან' : undefined,
          }}
        >
          {screens}
        </Stack>
      </ScrollReanimatedValueProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 20,
  },
  statusContainer: {
    alignItems: 'center',
    maxWidth: 280,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    fontWeight: '400',
  },
});
