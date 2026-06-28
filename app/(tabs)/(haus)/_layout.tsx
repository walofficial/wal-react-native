import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme';

export default function HausStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Haus' }} />
      <Stack.Screen name="access" options={{ title: 'Haus access' }} />
      <Stack.Screen name="house/[houseId]" options={{ title: 'House' }} />
      <Stack.Screen name="event/[eventId]" options={{ title: 'Event' }} />
      <Stack.Screen name="host-queue" options={{ title: 'Host inbox' }} />
      <Stack.Screen name="check-in" options={{ title: 'Check in guest' }} />
    </Stack>
  );
}
