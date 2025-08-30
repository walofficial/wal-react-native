import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import ProfileHeader from '@/components/ProfileHeader';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import useAuth from '@/hooks/useAuth';
import { Link, Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import SimpleGoBackHeaderPost from '@/components/SimpleGoBackHeaderPost';
import React from 'react';
import { CustomTitle } from '@/components/CustomTitle';
import { t } from '@/lib/i18n';

export default function Layout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: theme.colors.background,
      }}
    >
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerBackVisible: true,
        }}
      >
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
        />

        <Stack.Screen
          name="verification/[verificationId]"
          options={({ route }) => {
            const params = route.params as { verificationId?: string };
            const verificationId = params?.verificationId;
            return {
              headerTransparent: true,
              header: () => {
                return (
                  <SimpleGoBackHeaderPost verificationId={verificationId} />
                );
              },
            };
          }}
        />

        <Stack.Screen
          name="change-photo"
          options={{
            title: '',
            headerTransparent: true,
            header: () => (
              <SimpleGoBackHeader title={t('common.change_photo')} />
            ),
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
          }}
        />

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
        />
        <Stack.Screen
          name="blocked-users"
          options={{
            title: 'დაბლოკილი',
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
          }}
        />
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
        />
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
        />
      </Stack>
    </View>
  );
}
