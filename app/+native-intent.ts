import { getShareExtensionKey } from 'expo-share-intent';

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: string;
}) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      // redirect to the ShareIntent Screen to handle data with the hook
      return '/(tabs)/shareintent';
    }
    return path;
  } catch {
    return '/';
  }
}
