import 'react-native-url-polyfill/auto';
import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import RemoteConfigBanner from './RemoteConfigBanner';
import { useRouter } from 'expo-router';
import ProtocolService from '@/lib/services/ProtocolService';
import { createUser, getUser, User } from '@/lib/api/generated';
import useSendPublicKey from '@/hooks/useSendPublicKey';
import { getDeviceId } from '@/lib/device-id';
import { isWeb } from '@/lib/platform';
import { useToast } from './ToastUsage';
import { getCurrentLocale, getLanguageFromLocale, t } from '@/lib/i18n';
import { updateAcceptLanguageHeader } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext<{
  isLoading: boolean;
  userIsLoading: boolean;
  error: string | null;
  session: Session | null;
  user: User | undefined;
  logout: () => Promise<void>;
  setAuthUser: (user: any) => void;
  setSession: (session: Session | null) => void;
}>({
  isLoading: false,
  userIsLoading: false,
  error: null,
  logout: async () => {},
  session: null,
  user: undefined,
  setAuthUser: () => {},
  setSession: () => {},
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export const isUserRegistered = (user: User) => {
  return !!user.date_of_birth && !!user.gender;
};

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
  shouldRetry: (error: any) => boolean = (error) => {
    // Retry on network errors, 5xx server errors, and rate limiting
    const status = error?.response?.status;
    return !status || status >= 500 || status === 429;
  },
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const backoff = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 100;
      const delay = backoff + jitter;

      console.warn(
        `Attempt ${attempt + 1} failed. Retrying in ${delay.toFixed(0)}ms...`,
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic error'); // Should never reach here
}

async function handleUserNotFound(supabaseUser: any) {
  const currentLocale = getCurrentLocale();
  const language = getLanguageFromLocale(currentLocale);

  return await retryWithBackoff(
    () =>
      createUser({
        body: {
          external_user_id: supabaseUser.id,
          email: supabaseUser.email || supabaseUser?.phone,
          phone_number: supabaseUser?.phone,
          date_of_birth: '',
          gender: null,
          username: '',
          photos: [],
          interests: [],
          city: null,
          preferred_content_language: language,
        },
        throwOnError: true,
      }),
    15, // maxRetries
    500, // baseDelay
    (error) => {
      // Only retry on system errors, not client errors
      const status = error?.response?.status;
      return !status || status >= 500 || status === 429;
    },
  );
}

export default function AuthLayer({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isWeb);
  const [userIsLoading, setUserIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const { sendPublicKey } = useSendPublicKey();
  const { error: errorToast, success: successToast, dismissAll } = useToast();

  useEffect(() => {
    // Update the API client configuration whenever the Accept-Language header changes
    updateAcceptLanguageHeader(user?.preferred_content_language || '');
  }, [user?.preferred_content_language]);

  // Handle user registration status
  useEffect(() => {
    if (user) {
      // Send public key when we have a user
      (async () => {
        const deviceId = await getDeviceId();
        sendPublicKey({ userId: user.id, deviceId });
      })();
    }
  }, [user]);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      if (!session) return;
      try {
        setUserIsLoading(true);

        const dbUser = await retryWithBackoff(
          () => getUser({ throwOnError: true }),
          15, // maxRetries
          500, // baseDelay
          (error) => {
            // Only retry on system errors, not 404 or auth errors
            const status = error?.response?.status;
            return (
              !status ||
              (status >= 500 &&
                status !== 404 &&
                status !== 401 &&
                status !== 403) ||
              status === 429
            );
          },
        );

        setUserIsLoading(false);
        setUser(dbUser.data);
        // Get region so that application knows which feed ids to load
      } catch (e: any) {
        if (e.response?.status === 404) {
          const supabaseUser = await supabase.auth.getUser();
          if (supabaseUser.data.user?.id) {
            sendPublicKey({ userId: supabaseUser.data.user.id });
          }

          try {
            const newUser = await handleUserNotFound(supabaseUser.data.user);
            setUser(newUser.data);
            dismissAll();
            setUserIsLoading(false);
          } catch (innerError) {
            dismissAll();
            errorToast({ title: t('common.system_error') });
            console.error('Error creating new user (inner):', innerError);
          }
        } else if (e.response?.status === 401) {
          dismissAll();
          errorToast({ title: t('common.session_expired') });
          await supabase.auth.signOut();
        } else {
          dismissAll();
          errorToast({ title: t('common.system_error') });
          console.error('Error fetching user:', e);
        }
        setUserIsLoading(false);
      }
    }
    fetchUser();
  }, [session]);

  // Auth state management
  useEffect(() => {
    setIsLoading(true);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setIsLoading(false);
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        ProtocolService.clearKeys();
        setUser(undefined);
      }
      setSession(session);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userIsLoading,
        error,
        user,
        setAuthUser: setUser,
        setSession: setSession,
        logout: async () => {
          await supabase.auth.signOut();
        },
        session: session || null,
      }}
    >
      <RemoteConfigBanner />
      {children}
    </AuthContext.Provider>
  );
}
// Not sure if we need remote config banner for web
