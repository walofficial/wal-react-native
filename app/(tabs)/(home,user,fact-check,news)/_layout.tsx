import React from 'react';
import { Link, Stack } from 'expo-router';
import ProfileHeader from '@/components/ProfileHeader';
import { CustomTitle, TaskTitle } from '@/components/CustomTitle';
import { ScrollReanimatedValueProvider } from '@/components/context/ScrollReanimatedValue';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS, isWeb } from '@/lib/platform';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import SimpleGoBackHeaderPost from '@/components/SimpleGoBackHeaderPost';
import { ProfilePageUsername } from '@/components/ProfilePageUsername';
import { useTheme } from '@/lib/theme';
import useTranslation from '@/hooks/useTranslation';
import { FontSizes } from '@/lib/theme';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import useAuth from '@/hooks/useAuth';
import LocationProvider from '@/components/LocationProvider';

export const unstable_settings = {
  initialRouteName: 'index',
  'fact-check': {
    initialRouteName: '(index)',
  },
  news: {
    initialRouteName: '(index)',
  },
  home: {
    initialRouteName: '(index)',
  },
  user: {
    initialRouteName: '(index)',
  },
};

export default function Layout({ segment }: { segment: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isNewsFeed = segment === '(news)';
  const isFactCheckFeed = segment === '(fact-check)';
  const isHomeFeed = segment === '(home)';
  const isUserFeed = segment === '(user)';
  const { user } = useAuth();
  const theme = useTheme();
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
      name="profile-picture"
      options={{
        headerTransparent: true,
        header: () => <SimpleGoBackHeader title="ფოტო" />,
      }}
    />,
  ];
  if (isHomeFeed) {
    screens.push(
      <Stack.Screen
        name="[feedId]/index"
        options={({ route }) => ({
          headerTransparent: !isWeb,
          animation: 'fade',
          header: () => (
            <ProfileHeader
              showTabs={true}
              //@ts-ignore
              customTitleComponent={<TaskTitle feedId={route.params?.feedId} />}
              showLocationTabs={true}
              //@ts-ignore
              feedId={route.params?.feedId}
            />
          ),
        })}
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
            : ({ route }) => (
                <ProfileHeader
                  isAnimated
                  customTitleComponent={
                    <TaskTitle
                      //@ts-ignore
                      feedId={
                        isFactCheckFeed
                          ? user.preferred_fact_check_feed_id
                          : isNewsFeed
                            ? user.preferred_news_feed_id
                            : user.preferred_fact_check_feed_id
                      }
                    />
                  }
                  showSearch={!isUserFeed}
                  showLocationTabs={!isNewsFeed && !isFactCheckFeed}
                  showTabs={!isNewsFeed && !isUserFeed}
                  feedId={
                    isFactCheckFeed
                      ? user.preferred_fact_check_feed_id
                      : user.preferred_news_feed_id
                  }
                  //@ts-ignore
                  content_type={route.params?.content_type || 'last24h'}
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
