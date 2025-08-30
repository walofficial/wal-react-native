import { Platform, Share } from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import { isAndroid, isIOS } from '@/lib/platform';
import { toast } from '@backpackapp-io/react-native-toast';
import { ShareOptions } from 'react-native-share';
/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 */
export async function shareUrl(url: string) {
  let Share: any;
  if (Platform.OS !== 'web') {
    Share = require('react-native-share').default as ShareOptions;
    await Share.open({ message: url });
  } else {
    if (isAndroid) {
      await Share.share({ message: url });
    } else if (isIOS) {
      await Share.share({ url });
    } else {
      // React Native Share is not supported by web. Web Share API
      // has increasing but not full support, so default to clipboard
      setStringAsync(url);
      // toast("Copied to clipboard", {
      //   id: "clipboard-check",
      // });
    }
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
    toast('Copied to clipboard', {
      id: 'clipboard-check',
    });
  }
}
