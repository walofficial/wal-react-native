import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import ChatTopbar from '@/components/Chat/chat-topbar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useKeyboardVerticalOffset from '@/hooks/useKeyboardVerticalOffset';
import DbUserGetter from '@/components/DbUserGetter';

function Layout() {
  const insets = useSafeAreaInsets();
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
        </Stack>
      </View>
    </DbUserGetter>
  );
}

export default Layout;
