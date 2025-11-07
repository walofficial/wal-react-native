import { Platform, Share } from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import { isAndroid, isIOS } from '@/lib/platform';
/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 */
export async function shareUrl(url: string) {
  if (Platform.OS === 'web') {
    // Web Share API support varies; default to clipboard
    await setStringAsync(url);
    return;
  }

  // Use React Native Share API on native
  if (isAndroid) {
    await Share.share({ message: url });
  } else if (isIOS) {
    await Share.share({ url, message: url });
  } else {
    await setStringAsync(url);
  }
}

/**
 * This function shares a text using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 *
 * @param {string} text - A string representing the text that needs to be shared or copied to the
 * clipboard.
 */
export async function shareText(text: string) {
  if (isAndroid || isIOS) {
    await Share.share({ message: text });
  } else {
    await setStringAsync(text);
  }
}
