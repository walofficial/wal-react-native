import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useAtom, useSetAtom } from "jotai";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { appLocaleAtom } from "@/hooks/useAppLocalization";
import { getCurrentLocale, setLocale } from "@/lib/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

const LanguageSelectionOverlay: React.FC = () => {
  const theme = useTheme();
  const [appLocale, setAppLocaleState] = useAtom(appLocaleAtom);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const overlayScale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (showLanguageSelector) {
      overlayScale.value = withSpring(1, {
        damping: 15,
        stiffness: 90,
      });
      overlayOpacity.value = withSpring(1);
    } else {
      overlayScale.value = withSpring(0);
      overlayOpacity.value = withSpring(0);
    }
  }, [showLanguageSelector]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem("app-locale");
        if (!storedLocale) {
          setShowLanguageSelector(true);
        }
        console.log("storedLocale", storedLocale);
        const localeToUse = storedLocale || getCurrentLocale();
        setAppLocaleState(localeToUse);
        console.log("localeToUse", localeToUse);
        setLocale(localeToUse);
        console.log("getCurrentLocale", getCurrentLocale());
      } catch {
        const fallback = getCurrentLocale();
        setAppLocaleState(fallback);
        setLocale(fallback);
      }
    };
    initialize();
    setIsInitialized(true);
  }, []);

  const onSelect = (locale: "en" | "ka") => {
    setAppLocaleState(locale);
    AsyncStorage.setItem("app-locale", locale).then(() => {
      setLocale(locale);
      setShowLanguageSelector(false);
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: overlayScale.value }],
      opacity: overlayOpacity.value,
    };
  });

  if (!isInitialized) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: theme.colors.background },
        animatedStyle,
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Choose app language
      </Text>

      <View style={styles.optionsRow}>
        <Pressable
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => onSelect("en")}
        >
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
            English
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => onSelect("ka")}
        >
          <Text style={styles.flag}>🇬🇪</Text>
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
            ქართული
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  option: {
    width: 160,
    height: 160,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  flag: {
    fontSize: 56,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LanguageSelectionOverlay;
