import { Dimensions, Platform } from "react-native";
import StaticSafeAreaInsets from "react-native-static-safe-area-insets";

export const CONTENT_SPACING = 15;

// Use zero insets on web, otherwise use StaticSafeAreaInsets
const safeAreaInsets =
  Platform.OS === "web"
    ? {
        safeAreaInsetsLeft: 0,
        safeAreaInsetsTop: 0,
        safeAreaInsetsRight: 0,
        safeAreaInsetsBottom: 0,
      }
    : StaticSafeAreaInsets;

const SAFE_BOTTOM =
  Platform.select({
    ios: safeAreaInsets.safeAreaInsetsBottom,
    web: 0, // no insets on web
  }) ?? 0;

export const SAFE_AREA_PADDING = {
  paddingLeft: safeAreaInsets.safeAreaInsetsLeft + CONTENT_SPACING,
  paddingTop: safeAreaInsets.safeAreaInsetsTop + CONTENT_SPACING,
  paddingRight: safeAreaInsets.safeAreaInsetsRight + CONTENT_SPACING,
  paddingBottom: SAFE_BOTTOM + CONTENT_SPACING,
};

// The maximum zoom _factor_ you should be able to zoom in
export const MAX_ZOOM_FACTOR = 10;

export const SCREEN_WIDTH = Dimensions.get("window").width;

// For web, fall back to Dimensions.get("window").height
export const SCREEN_HEIGHT = Platform.select<number>({
  android:
    Dimensions.get("screen").height - safeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get("window").height,
  web: Dimensions.get("window").height,
}) as number;

// Capture Button
export const CAPTURE_BUTTON_SIZE = 78;

// Control Button like Flash
export const CONTROL_BUTTON_SIZE = 40;

export const BORDER_WIDTH = 2;
