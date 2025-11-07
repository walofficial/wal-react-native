import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translation files
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ka from '../locales/ka.json';

// Create a new I18n instance
const i18n = new I18n({
  en,
  fr,
  ka,
});

// Set the locale based on device settings
// If the device locale is not supported, fallback to English
const supportedLocales = ['en', 'fr', 'ka'];

// Get the device's preferred locale using the modern API
const deviceLocales = getLocales();
const deviceLanguageCode = deviceLocales[0]?.languageCode ?? 'en';

// Set locale to supported language or fallback to English
i18n.locale = supportedLocales.includes(deviceLanguageCode)
  ? deviceLanguageCode
  : 'en';

// Enable fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Export translation function
export function t(key: string, options?: any): string {
  return i18n.t(key, options);
}

// Export locale utilities
export function getCurrentLocale(): string {
  return i18n.locale;
}

export function setLocale(locale: string): void {
  if (supportedLocales.includes(locale)) {
    i18n.locale = locale;
  }
}

export function getSupportedLocales(): string[] {
  return supportedLocales;
}

// Get device's preferred locale
export function getDeviceLocale(): string {
  const locales = getLocales();
  return locales[0]?.languageTag ?? 'en';
}

// Map locale codes to region names for feed selection
export function getRegionFromLocale(
  locale: string,
): 'georgia' | 'united_states' | 'france' {
  switch (locale) {
    case 'ka':
      return 'georgia';
    case 'en':
      return 'united_states';
    case 'fr':
      return 'france';
    default:
      return 'united_states'; // Default fallback
  }
}

// Map locale codes to language names
export function getLanguageFromLocale(locale: string): string {
  switch (locale) {
    case 'ka':
      return 'georgian';
    case 'en':
      return 'english';
    case 'fr':
      return 'french';
    default:
      return 'english';
  }
}

export default i18n;
