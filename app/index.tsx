import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false, // Reanimated runs in strict mode by default
});
import { useSession } from '@/components/AuthLayer';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { appIsReadyState } from '@/lib/state/app';
import { useAtom } from 'jotai';

export default function Index() {
  const { session, isLoading, userIsLoading, user } = useSession();
  const [appIsReady, setAppIsReady] = useAtom(appIsReadyState);
  useEffect(() => {
    if (session) {
      setAppIsReady(true);
    }
  }, [session]);

  if (session && !userIsLoading && user && user.preferred_news_feed_id) {
    // This fires when user is signed in the application and app was fully closed. We don't specifiy the route to navigate here as it is dictacted by the tab layout tab
    return <Redirect href={`/(tabs)/(news)`} />;
  }
  if (isLoading || userIsLoading) {
    // Splash screen is anyway shown here with above useEffect
    return null;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
