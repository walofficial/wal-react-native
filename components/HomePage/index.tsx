import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import UserLogin from "../UserLogin";
import VideoPlayer from "../VideoPlayer";
import { useRef, useEffect } from "react";
import { useAtom } from "jotai";
import BottomSheet, { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { FontSizes } from "@/lib/theme";
import { isAndroid } from "@/lib/platform";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSelectionOverlay from "@/components/LanguageOverlay";
import { appLocaleAtom } from "@/hooks/useAppLocalization";

const VIDEO_URI =
  "https://cdn.wal.ge/video-verifications/transcoded/f2897541-6768-4ae2-ab28-1894d3e96e5f/manifest.mpd";

export default function HomePage() {
  const userLoginRef = useRef<BottomSheet>(null);
  const [appLocale] = useAtom(appLocaleAtom);
  const { t } = useTranslation();

  useEffect(() => {
    if (isAndroid) {
      NavigationBar.setPositionAsync("absolute");
      NavigationBar.setBackgroundColorAsync("transparent");
    }
  }, []);

  return (
    <BottomSheetModalProvider>
      <StatusBar translucent style="auto" />
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          <VideoPlayer videoUri={VIDEO_URI} style={styles.videoView} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.bottomContent}>
            <Text style={styles.logo}>WAL</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{t("common.what_happening")}</Text>
              <Text style={styles.subtitle}>
                {t("common.unfiltered_verified_info")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                userLoginRef.current?.snapToIndex(0);
              }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{t("common.sign_in")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <LanguageSelectionOverlay />
      <UserLogin ref={userLoginRef} />
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  bottomContent: {
    gap: 16,
    alignItems: "flex-start",
    width: "100%",
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  textContainer: {
    gap: 8,
    width: "100%",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: "#D1D5DB",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#efefef",
    borderRadius: 12,
    width: "100%",
    padding: 16,
  },
  buttonText: {
    color: "black",
    fontSize: 20,
    fontWeight: "600",
  },
});
