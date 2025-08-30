import { atom, useAtom } from 'jotai';

export const appLocaleAtom = atom<string | null>(null);

/**
 * Hook to initialize app localization on startup
 * This ensures the app loads with the device's preferred locale
 * and sets up user preferences accordingly
 */
