import { Stack } from 'expo-router';
import ProfileHeader from '@/components/ProfileHeader';
import { TaskTitle } from '@/components/CustomTitle';
import { ScrollReanimatedValueProvider } from '@/components/context/ScrollReanimatedValue';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfilePageUsername } from '@/components/ProfilePageUsername';
import ChatTopbar from '@/components/Chat/chat-topbar';
import { isIOS, isWeb } from '@/lib/platform';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import SimpleGoBackHeaderPost from '@/components/SimpleGoBackHeaderPost';
import LocationProvider from '@/components/LocationProvider';

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <LocationProvider>
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <ScrollReanimatedValueProvider>
          <Stack
            screenOptions={{
              headerBackVisible: true,
              headerBackTitle: isWeb ? 'უკან' : 'უკან',
            }}
          >
            {/* Optionally configure static options outside the route.*/}
            <Stack.Screen
              name="index"
              options={{
                headerTransparent: !isWeb,
                header: () => (
                  <ProfileHeader customTitleComponent={<TaskTitle />} />
                ),
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                headerTransparent: !isWeb,
                header: () => <ProfilePageUsername />,
              }}
            />

            <Stack.Screen
              name="chatrooms/index"
              options={{
                header: () => <SimpleGoBackHeader title="ჩათი" />,
              }}
            />
            <Stack.Screen
              name="chatrooms/[roomId]/index"
              options={{
                headerTransparent: true,
                header: () => <ChatTopbar />,
              }}
            />
            <Stack.Screen
              name="profile-picture"
              options={{
                headerTransparent: true,
                header: () => <SimpleGoBackHeader title="ფოტო" />,
              }}
            />

            <Stack.Screen
              name="verification/[verificationId]"
              options={({ route }) => {
                const params = route.params as { verificationId?: string };
                const verificationId = params?.verificationId || '';

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
              name="[feedId]/index"
              options={{
                headerTransparent: !isWeb,
                animation: 'fade',
                header: () => (
                  <ProfileHeader
                    customTitleComponent={<TaskTitle />}
                    showLocationTabs={true}
                    showTabs={true}
                  />
                ),
              }}
            />

            <Stack.Screen
              name="livestream"
              options={{
                header: () => null,
              }}
            />

            <Stack.Screen
              name="[feedId]/create-post"
              options={{
                presentation: isIOS ? 'modal' : 'card',
                animation: isIOS ? 'slide_from_bottom' : 'fade_from_bottom',
                animationDuration: 200,
                header: () => null,
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="[feedId]/create-space/index"
              options={{
                title: 'ოთახის შექმნა',
                headerStyle: {
                  backgroundColor: 'black',
                },
              }}
            />
            <Stack.Screen
              name="[feedId]/create-space/schedule-space"
              options={{
                title: 'ოთახის დაწყების დრო',
                headerStyle: {
                  backgroundColor: 'black',
                },
              }}
            />
          </Stack>
        </ScrollReanimatedValueProvider>
      </View>
    </LocationProvider>
  );
}
