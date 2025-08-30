import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;
export const devicePlatform = isIOS ? 'ios' : isAndroid ? 'android' : 'web';
export const isWeb = !isNative;

export const isMobileWebMediaQuery = 'only screen and (max-width: 1300px)';
export const isMobileWeb =
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches;
export const isIPhoneWeb = isWeb && /iPhone/.test(navigator.userAgent);

/**
 * Identity function on web. Returns nothing on other platforms.
 *
 * Note: Platform splitting does not tree-shake away the other platforms,
 * so don't do stuff like e.g. rely on platform-specific imports. Use
 * platform-split files instead.
 */
export function web(value: any) {
  if (isWeb) {
    return value;
  }
}

/**
 * Identity function on iOS. Returns nothing on other platforms.
 *
 * Note: Platform splitting does not tree-shake away the other platforms,
 * so don't do stuff like e.g. rely on platform-specific imports. Use
 * platform-split files instead.
 */
export function ios(value: any) {
  if (isIOS) {
    return value;
  }
}

/**
 * Identity function on Android. Returns nothing on other platforms..
 *
 * Note: Platform splitting does not tree-shake away the other platforms,
 * so don't do stuff like e.g. rely on platform-specific imports. Use
 * platform-split files instead.
 */
export function android(value: any) {
  if (isAndroid) {
    return value;
  }
}

/**
 * Identity function on iOS and Android. Returns nothing on web.
 *
 * Note: Platform splitting does not tree-shake away the other platforms,
 * so don't do stuff like e.g. rely on platform-specific imports. Use
 * platform-split files instead.
 */
export function native(value: any) {
  if (isNative) {
    return value;
  }
}

/**
 * Note: Platform splitting does not tree-shake away the other platforms,
 * so don't do stuff like e.g. rely on platform-specific imports. Use
 * platform-split files instead.
 */
export const platform = Platform.select;
