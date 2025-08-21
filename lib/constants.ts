import { atom } from "jotai";
import { Dimensions, Platform } from "react-native";

export const NAV_THEME = {
  light: {
    background: "hsl(0 0% 100%)", // background
    border: "hsl(240 5.9% 90%)", // border
    card: "hsl(0 0% 100%)", // card
    notification: "hsl(0 84.2% 60.2%)", // destructive
    primary: "hsl(240 5.9% 10%)", // primary
    text: "hsl(240 10% 3.9%)", // foreground
  },
  dark: {
    border: "hsl(240 3.7% 15.9%)", // border
    card: "hsl(240 10% 3.9%)", // card
    notification: "hsl(0 72% 51%)", // destructive
    primary: "hsl(0 0% 98%)", // primary
    text: "hsl(0 0% 98%)", // foreground
  },
};

export const HEADER_HEIGHT = atom<number>(
  Platform.OS === "web" ? 0 : Dimensions.get("window").height * 0.1
);
export const HEADER_HEIGHT_WITH_TABS = atom<number>(
  Platform.OS === "web" ? 0 : Dimensions.get("window").height * 0.1
);

export const SUPPORTED_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "video/quicktime",
  "image/gif",
] as const;

export type SupportedMimeTypes = (typeof SUPPORTED_MIME_TYPES)[number];

export const POST_IMG_MAX = {
  width: 2000,
  height: 2000,
  size: 1000000,
};


// Legacy constants - kept for backward compatibility
// These are the Georgian region feed IDs
export const FACT_CHECK_FEED_ID = "67bb256786841cb3e7074bcd";
export const NEWS_FEED_ID = "687960db5051460a7afd6e63";
export const CATEGORY_ID = "669e9a03dd31644abb767337";

