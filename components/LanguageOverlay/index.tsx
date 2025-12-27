import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { useAtom } from 'jotai';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';
import { appLocaleAtom } from '@/hooks/useAppLocalization';
import { getCurrentLocale, setLocale } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSelectionOverlay: React.FC = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [, setAppLocaleState] = useAtom(appLocaleAtom);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('app-locale');
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

  const onSelect = (locale: 'en' | 'ka') => {
    setAppLocaleState(locale);
    AsyncStorage.setItem('app-locale', locale).then(() => {
      setLocale(locale);
      setShowLanguageSelector(false);
    });
  };

  if (!isInitialized || !showLanguageSelector) {
    return null;
  }

  const cardBackground = isDark
    ? 'rgba(44, 44, 46, 0.95)'
    : 'rgba(255, 255, 255, 0.98)';

  const cardShadow = isDark
    ? {
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
      }
    : {
        boxShadow:
          '0px 2px 8px rgba(0, 0, 0, 0.04), 0px 8px 24px rgba(0, 0, 0, 0.08)',
      };

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.optionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: cardBackground,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
            cardShadow,
          ]}
          onPress={() => onSelect('en')}
        >
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
            English
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: cardBackground,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
            cardShadow,
          ]}
          onPress={() => onSelect('ka')}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  option: {
    width: 150,
    height: 150,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 52,
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default LanguageSelectionOverlay;
