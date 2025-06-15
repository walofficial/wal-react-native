import { useRouter } from "expo-router";

export function useNotificationHandler() {
  const router = useRouter();

  // Web implementation might handle notifications differently
  // but we're ensuring consistent behavior across platforms

  return null;
}

export default useNotificationHandler;
