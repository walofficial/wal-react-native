import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MenuView as RNMenuView,
  MenuComponentRef,
} from '@react-native-menu/menu';
import { Ionicons } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { t, setLocale, getCurrentLocale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import AnimatedPressable from '@/components/AnimatedPressable';
import { appLocaleAtom } from '@/hooks/useAppLocalization';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'en' | 'ka' | 'fr';

interface LanguageOption {
  id: Locale;
  flag: string;
  name: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', flag: '🇺🇸', name: 'English' },
  { id: 'ka', flag: '🇬🇪', name: 'ქართული' },
];

interface LanguageSelectorProps {
  onLanguageChange?: (locale: Locale) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const menuRef = useRef<MenuComponentRef>(null);
  const [appLocale, setAppLocaleState] = useAtom(appLocaleAtom);
  const theme = useTheme();

  const currentLocale = (appLocale || getCurrentLocale()) as Locale;

  const handleLanguageSelect = async (locale: Locale) => {
    setAppLocaleState(locale);
    await AsyncStorage.setItem('app-locale', locale);
    setLocale(locale);
    onLanguageChange?.(locale);
  };

  const getCurrentLanguageOption = (): LanguageOption => {
    return (
      LANGUAGE_OPTIONS.find((opt) => opt.id === currentLocale) ||
      LANGUAGE_OPTIONS[0]
    );
  };

  const currentOption = getCurrentLanguageOption();

  return (
    <RNMenuView
      ref={menuRef}
      title={t('settings.language')}
      onPressAction={({ nativeEvent }) => {
        const selectedLocale = nativeEvent.event as Locale;
        if (
          selectedLocale &&
          LANGUAGE_OPTIONS.some((o) => o.id === selectedLocale)
        ) {
          handleLanguageSelect(selectedLocale);
        }
      }}
      shouldOpenOnLongPress={false}
      actions={LANGUAGE_OPTIONS.map((option) => ({
        id: option.id,
        title: `${option.flag} ${option.name}`,
        state: currentLocale === option.id ? 'on' : 'off',
      }))}
    >
      <AnimatedPressable
        onClick={() => {
          menuRef.current?.show();
        }}
      >
        <Ionicons size={28} name="language-outline" color={theme.colors.icon} />
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {t('settings.language')}
        </Text>
        <View style={styles.languageContainer}>
          <Text style={styles.flag}>{currentOption.flag}</Text>
          <Text style={[styles.selectedText, { color: theme.colors.text }]}>
            {currentOption.name}
          </Text>
        </View>
      </AnimatedPressable>
    </RNMenuView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    marginLeft: 16,
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    opacity: 0.7,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
});

export default LanguageSelector;
