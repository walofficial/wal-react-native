import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { useSession } from "@/components/AuthLayer";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/interfaces";
import { useRouter } from "expo-router";

function useAuth() {
  const queryClient = useQueryClient();
  const { logout, user, setAuthUser, setSession } = useSession();
  return {
    user: user as User,
    logout: async () => {
      setSession(null);
      setAuthUser(null);
      await logout();

      // api.resetToken();
      // router.navigate("/(auth)/sign-in");

      queryClient.resetQueries({
        queryKey: ["user-matches"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-matches"],
      });
      queryClient.clear();
    },
    reset: () => {
      queryClient.resetQueries({
        queryKey: ["user-matches"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-matches"],
      });
      queryClient.clear();
    },
    setAuthUser,
  };
}

export default useAuth;
