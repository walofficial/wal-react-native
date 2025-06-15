import "react-native-url-polyfill/auto";
import { useState, useEffect, useContext, createContext } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import RemoteConfigBanner from "./RemoteConfigBanner";
import { useRouter } from "expo-router";
import ProtocolService from "@/lib/services/ProtocolService";
import api from "@/lib/api";
import { User } from "@/lib/interfaces";
import useSendPublicKey from "@/hooks/useSendPublicKey";
import { toast } from "@backpackapp-io/react-native-toast";
import { isWeb } from "@/lib/platform";

const AuthContext = createContext<{
  isLoading: boolean;
  userIsLoading: boolean;
  error: string | null;
  session: Session | null;
  user: User | null;
  logout: () => Promise<void>;
  setAuthUser: (user: any) => void;
  setSession: (session: Session | null) => void;
}>({
  isLoading: false,
  userIsLoading: false,
  error: null,
  logout: async () => {},
  session: null,
  user: null,
  setAuthUser: () => {},
  setSession: () => {},
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export const isUserRegistered = (user: User) => {
  return !!user.date_of_birth && !!user.gender;
};

async function handleUserNotFound(supabaseUser: any) {
  return await api.createUser({
    external_user_id: supabaseUser.id,
    email: supabaseUser.email || supabaseUser?.phone,
    phone_number: supabaseUser?.phone,
    date_of_birth: "",
    gender: null,
    username: "",
    profile_image: supabaseUser.photoURL,
    photos: [],
    interests: [],
  });
}

export default function AuthLayer({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isWeb);
  const [userIsLoading, setUserIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { sendPublicKey } = useSendPublicKey();

  // Handle user registration status
  useEffect(() => {
    if (user) {
      if (!isUserRegistered(user)) {
        router.navigate("/(auth)/register");
      }
      // Send public key when we have a user
      sendPublicKey({ userId: user.id });
    }
  }, [user]);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      if (!session) return;

      try {
        setUserIsLoading(true);

        const dbUser = await api.getUser();
        setUserIsLoading(false);

        setUser(dbUser);
      } catch (e: any) {
        if (e.response?.status === 404) {
          toast("აი ცოტაც...", {
            id: "create-user",
          });

          const supabaseUser = await supabase.auth.getUser();
          try {
            const newUser = await handleUserNotFound(supabaseUser.data.user);
            setUser(newUser);
            toast.dismiss("create-user");
            setUserIsLoading(false);
          } catch (error) {
            toast.dismiss("create-user");
            setUserIsLoading(false);
            toast.error("სისტემური ხარვეზი", {
              duration: 3000,
              id: "create-user",
            });
            console.error("Error creating new user:", error);
          }
        } else if (e.response?.status === 401) {
          toast.error("სესია დასრულდა. გთხოვთ შედით თავიდან", {
            duration: 3000,
          });
          await supabase.auth.signOut();
        } else {
          setUserIsLoading(false);

          toast.error("სისტემური ხარვეზი", {
            duration: 3000,
            id: "fetch-user",
          });
          console.error("Error fetching user:", e);
        }
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
      if (_event === "SIGNED_OUT") {
        ProtocolService.clearKeys();
        setUser(null);
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
      {/* <RemoteConfigBanner /> */}
      {children}
    </AuthContext.Provider>
  );
}
// Not sure if we need remote config banner for web
