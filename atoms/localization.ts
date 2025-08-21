import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { getCurrentLocale, getRegionFromLocale, getLanguageFromLocale } from '@/lib/i18n';

// Type definitions for user preferences
export type Region = 'georgia' | 'united_states' | 'france';
export type ContentLanguage = 'english' | 'french' | 'georgian';

// Feed IDs for different regions
export const NEWS_FEED_TO_REGION: Record<string, Region> = {
  "687960db5051460a7afd6e63": "georgia",
  "687960db5051460a7afd6e64": "united_states",
  "687960db5051460a7afd6e65": "france"
};

export const REGION_FEED_IDS = {
  georgia: {
    news: "687960db5051460a7afd6e63",
    factCheck: "67bb256786841cb3e7074bcd",
    category: "669e9a03dd31644abb767337"
  },
  united_states: {
    news: "68a62605b6cf9523bde06f0e",
    factCheck: "68a625d1b6cf9523bde06f0b",
    category: "669e9a03dd31644abb767338"
  },
  france: {
    news: "68a62555b6cf9523bde06f07",
    factCheck: "68a625a9b6cf9523bde06f09",
    category: "669e9a03dd31644abb767339"
  }
} as const;

// Helper function to get region from news feed ID
export const getRegionFromNewsFeedId = (newsFeedId: string): Region | undefined => {
  return NEWS_FEED_TO_REGION[newsFeedId];
};

// Map regions to country codes for flag display
export const REGION_TO_COUNTRY_CODE: Record<Region, string> = {
  georgia: "ge",
  united_states: "us",
  france: "fr"
};



