import * as Updates from 'expo-updates';
import { isWeb } from '../platform';
import { client } from './generated/client.gen';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const isDev =
  process.env.EXPO_PUBLIC_IS_DEV === 'true' &&
  Updates.channel !== 'preview' &&
  Updates.channel !== 'production';

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const API_BASE_URL = isWeb
  ? 'http://localhost:5500'
  : (process.env.EXPO_PUBLIC_API_URL as string);

const API_BASE_URL_OVERRIDE_KEY = 'API_BASE_URL_OVERRIDE';
let currentApiBaseUrl: string = API_BASE_URL;

export const getApiBaseUrl = (): string => currentApiBaseUrl;

export const setApiBaseUrl = async (
  newBaseUrl?: string | null,
): Promise<void> => {
  const nextBaseUrl =
    newBaseUrl && newBaseUrl.trim().length > 0
      ? newBaseUrl.trim()
      : API_BASE_URL;

  currentApiBaseUrl = nextBaseUrl;
  client.setConfig({
    baseURL: nextBaseUrl,
  });

  try {
    if (nextBaseUrl === API_BASE_URL) {
      await AsyncStorage.removeItem(API_BASE_URL_OVERRIDE_KEY);
    } else {
      await AsyncStorage.setItem(API_BASE_URL_OVERRIDE_KEY, nextBaseUrl);
    }
  } catch {
    // Ignore persistence errors; runtime base URL is already applied
  }
};

// Initialize the client with base URL
client.setConfig({
  baseURL: API_BASE_URL,
  throwOnError: false,
  headers: {
    'x-is-anonymous': String(isWeb),
  },
});

// Load and apply stored base URL override (if any)
(async () => {
  try {
    const storedOverride = await AsyncStorage.getItem(
      API_BASE_URL_OVERRIDE_KEY,
    );
    if (storedOverride && storedOverride !== currentApiBaseUrl) {
      currentApiBaseUrl = storedOverride;
      client.setConfig({ baseURL: storedOverride });
    }
  } catch {
    // Ignore storage read errors
  }
})();

// Helper to set/remove Authorization header from Supabase session token
let supabaseUserToken: string | undefined;
const applySupabaseAuthHeader = (token?: string) => {
  supabaseUserToken = token;
  client.setConfig({
    headers: {
      // Use null to remove header via mergeHeaders implementation
      Authorization: token ? `Bearer ${token}` : null,
    },
  });
};

// Initialize header from current session
supabase.auth.getSession().then(({ data }) => {
  const token = data.session?.access_token;
  applySupabaseAuthHeader(token);
});

// Keep Authorization header in sync with Supabase auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  applySupabaseAuthHeader(session?.access_token);
});

// Add request interceptor to always attach the latest token and handle multipart
client.instance.interceptors.request.use((config) => {
  // Handle multipart/form-data requests on Android
  if (config.data instanceof FormData) {
    // Remove Content-Type to let Axios set the proper boundary
    if (config.headers) {
      delete config.headers['Content-Type'];
      config.headers['Content-Type'] = null;
    }
  }

  return config;
});

// Add response interceptor to retry once on 401 with refreshed token
client.instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    if (error.response?.status === 401) {
      // originalRequest._retry = true;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        applySupabaseAuthHeader(token);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${token}`,
        };
        return client.instance(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
