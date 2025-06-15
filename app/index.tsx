import { useSession } from "@/components/AuthLayer";
import { isWeb } from "@/lib/platform";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { appIsReadyState } from "@/lib/state/app";
import { useAtom } from "jotai";

export default function Index() {
  const { session, isLoading } = useSession();
  const [appIsReady, setAppIsReady] = useAtom(appIsReadyState);

  useEffect(() => {
    if (session) {
      setAppIsReady(true);
    }
  }, [session]);

  if (session) {
    return <Redirect href="/(tabs)/(global)/67bb256786841cb3e7074bcd" />;
  }
  if (isLoading) {
    // Splash screen is anyway shown here with above useEffect
    return null;
  }

  if (isWeb) {
    // We don't have auth for web version for now
    return <Redirect href="/(tabs)/(global)/67bb256786841cb3e7074bcd" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
