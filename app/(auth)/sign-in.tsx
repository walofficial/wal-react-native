import { View } from 'react-native';

import HomePage from '@/components/HomePage';
import { isUserRegistered, useSession } from '@/components/AuthLayer';
import { Redirect } from 'expo-router';
import FullScreenLoader from '@/components/FullScreenLoader/FullScreenLoader';
export default function SignIn() {
  const { user, userIsLoading, isLoading } = useSession();
  if (isLoading || userIsLoading) {
    return <FullScreenLoader />;
  }
  if (user && isUserRegistered(user)) {
    return <Redirect href="/(tabs)" />;
  }

  if (user && !isUserRegistered(user)) {
    return <Redirect href="/(auth)/register" />;
  }

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <HomePage />
    </View>
  );
}
