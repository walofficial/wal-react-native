import { Stack } from 'expo-router';

function Layout() {
  return (
    <Stack>
      <Stack.Screen name="livestream" options={{ headerShown: false }} />
      <Stack.Screen name="record" options={{ headerShown: false }} />
      <Stack.Screen name="mediapage" options={{ headerShown: false }} />
    </Stack>
  );
}

export default Layout;
