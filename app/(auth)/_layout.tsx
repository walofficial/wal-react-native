import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';

function Layout() {
  return (
    <Stack screenOptions={{ animation: 'fade' }}>
      <Stack.Screen
        name="register"
        options={{
          headerTransparent: true,
          header: () => (
            <SimpleGoBackHeader
              title="რეგისტრაცია"
              logoutOnClick={true}
              withInsets={true}
            />
          ),
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
