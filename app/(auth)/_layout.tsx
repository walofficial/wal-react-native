import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { View } from 'react-native';

function Layout() {
  const insets = useSafeAreaInsets();
  return (
    <Stack>
      <Stack.Screen
        name="register"
        options={{
          headerTransparent: true,
          header: () => <SimpleGoBackHeader title="რეგისტრაცია" logoutOnClick={true} withInsets={true} />,
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default Layout;
