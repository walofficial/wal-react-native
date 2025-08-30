import * as Updates from 'expo-updates';
import { isWeb, isAndroid } from '../platform';
import { client } from './generated/client.gen';
import { supabase } from '../supabase';

export const isDev =
  process.env.EXPO_PUBLIC_IS_DEV === 'true' &&
  Updates.channel !== 'preview' &&
  Updates.channel !== 'production';

export const API_BASE_URL = isWeb
  ? 'http://localhost:5500'
  : (process.env.EXPO_PUBLIC_API_URL as string);

// Initialize the client with base URL
client.setConfig({
  baseURL: API_BASE_URL,
  throwOnError: false,
  headers: {
    'x-is-anonymous': String(isWeb),
  },
});

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
  if (supabaseUserToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${supabaseUserToken}`,
    } as any;
  }

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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        applySupabaseAuthHeader(token);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${token}`,
        };
        return client.instance.request(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
