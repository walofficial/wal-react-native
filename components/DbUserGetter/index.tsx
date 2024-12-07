import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/interfaces";
import { Text } from "react-native";
import api from "@/lib/api";
import { useAtom } from "jotai";
import { authUser } from "@/lib/state/auth";
import { H1, Small } from "../ui/typography";
import { useSession } from "../AuthLayer";
import { Redirect } from "expo-router";
import { Button } from "../ui/button";
import { View } from "react-native";
import { useNotificationHandler } from "./useNotficationHandler";

export const isUserRegistered = (user: User) => {
  return !!user.date_of_birth && !!user.gender;
};

export const needsOnlyPhoto = (user: User) => {
  return !!user.date_of_birth && !!user.gender;
};

async function handleUserNotFound(supabaseUser: any) {
  const newUser = await api.createUser({
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

  return newUser;
}

function DbUserGetter({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useAtom(authUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session: sessionUser } = useSession();
  useNotificationHandler();
  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    setError(null);

    async function getUser() {
      const user = await supabase.auth.getUser();

      // Fetching session to pass token to api
      const session = await supabase.auth.getSession();

      if (!user.data.user && session.data.session?.access_token) {
        setIsLoading(false);
        setError("force_logout");
        return {
          user: null,
          error: "force_logout",
        };
      }

      try {
        const dbUser = await api.getUser();
        setUser(dbUser);
        setIsLoading(false);
        setError(null);
        return {
          user: dbUser,
          error: null,
        };
      } catch (e: any) {
        if (e.response && e.response?.status === 404) {
          const supabaseUser = await supabase.auth.getUser();

          try {
            const newUser = await handleUserNotFound(supabaseUser.data.user);
            setIsLoading(false);
            setError(null);
            setUser(newUser);

            return {
              user: newUser,
              error: null,
            };
          } catch (e) {
            setIsLoading(false);
            setError("unauthorized");
            return {
              user: null,
              error: "unauthorized",
            };
          }
        } else {
          if (e?.response?.status === 401) {
            setIsLoading(false);
            setError("unauthorized");
            return {
              user: null,
              error: "unauthorized",
            };
          }
          console.error(e);
          setIsLoading(false);
          setError("system_error");
          return {
            user: null,
            error: "system_error",
          };
        }
      }
    }
    getUser();
  }, [sessionUser]);

  if (isLoading) {
    return null;
  }
  if (error) {
    if (error === "force_logout") {
      return <Redirect href="/sign-in" />;
    }
    if (error === "unauthorized") {
      return <Redirect href="/sign-in" />;
    }
    return (
      <View className="flex-1 items-center text-center justify-center bg-black">
        <H1>ხარვეზია, სცადეთ მოგვიანებით 🥲 </H1>
        {error && <Small className="my-5">{error}</Small>}
        <Button
          onPress={() => {
            setError(null);
          }}
        >
          <Text>განახლება</Text>
        </Button>
      </View>
    );
  }
  if (!user) {
    return null;
  }
  if (user && !isUserRegistered(user)) {
    if (needsOnlyPhoto(user)) {
      return <Redirect href="/photos" />;
    }
    return <Redirect href="/register" />;
  }
  return children;
}

export default DbUserGetter;
