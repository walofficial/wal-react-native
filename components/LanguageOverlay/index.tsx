import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useAtom } from "jotai";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { appLocaleAtom } from "@/hooks/useAppLocalization";
import { getCurrentLocale, setLocale } from "@/lib/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LanguageSelectionOverlay: React.FC = () => {
  const theme = useTheme();
  const [appLocale, setAppLocaleState] = useAtom(appLocaleAtom);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem("app-locale");
        if (!storedLocale) {
          setShowLanguageSelector(true);
        }
        const localeToUse = storedLocale || getCurrentLocale();
        setAppLocaleState(localeToUse);
        setLocale(localeToUse);
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

  if (!isInitialized || !showLanguageSelector) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Choose app language
      </Text>

      <View style={styles.optionsRow}>
        <Pressable
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.background,
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
              backgroundColor: theme.colors.background,
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
    </View>
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
