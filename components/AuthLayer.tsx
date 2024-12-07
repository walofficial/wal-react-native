import "react-native-url-polyfill/auto";
import { useState, useEffect, useContext, createContext } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import api from "@/lib/api";
import RemoteConfigBanner from "./RemoteConfigBanner";
import { usePathname } from "expo-router";

const AuthContext = createContext<{
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  logout: () => Promise<void>;
}>({
  isLoading: false,
  error: null,
  logout: async () => {},
  session: null,
});
// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export default function AuthLayer({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setSession(session);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        error,
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
