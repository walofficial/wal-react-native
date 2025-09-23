import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CONTENT_SPACING = 15;

export const useSafeAreaPadding = () => {
  const insets = useSafeAreaInsets();
  const safeBottom =
    Platform.select({
      ios: insets.bottom,
      web: 0, // no insets on web
      default: insets.bottom,
    }) ?? 0;

  return {
    paddingLeft: insets.left + CONTENT_SPACING,
    paddingTop: insets.top + CONTENT_SPACING,
    paddingRight: insets.right + CONTENT_SPACING,
    paddingBottom: safeBottom + CONTENT_SPACING,
  };
};

// The maximum zoom _factor_ you should be able to zoom in
export const MAX_ZOOM_FACTOR = 10;

export const SCREEN_WIDTH = Dimensions.get('window').width;

// For web, fall back to Dimensions.get("window").height
export const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height,
  ios: Dimensions.get('window').height,
  web: Dimensions.get('window').height,
}) as number;

// Capture Button
export const CAPTURE_BUTTON_SIZE = 78;

// Control Button like Flash
export const CONTROL_BUTTON_SIZE = 40;

export const BORDER_WIDTH = 2;
