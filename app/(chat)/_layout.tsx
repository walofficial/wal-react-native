import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import ChatTopbar from '@/components/Chat/chat-topbar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useKeyboardVerticalOffset from '@/hooks/useKeyboardVerticalOffset';
import DbUserGetter from '@/components/DbUserGetter';
import { useSession } from '@/components/AuthLayer';

function Layout() {
  const { session, isLoading, user, userIsLoading } = useSession();

  const insets = useSafeAreaInsets();
  if (isLoading || userIsLoading) {
    return null;
  }

  return (
    <DbUserGetter showMessagePreview={false}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Stack>
          <Stack.Screen
            name="[roomId]/index"
            options={{
              headerTransparent: true,
              header: () => <ChatTopbar />,
            }}
          />
          <Stack.Screen
            name="[roomId]/profile-picture"
            options={{
              headerTransparent: true,
              header: () => <SimpleGoBackHeader title="ფოტო" />,
            }}
          />
        </Stack>
      </View>
    </DbUserGetter>
  );
}

export default Layout;
