import { authUser } from "@/lib/state/auth";
import { supabase } from "@/lib/supabase";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { myStore } from "@/app/_layout";
import api from "@/lib/api";
import { useSession } from "@/components/AuthLayer";
import { useQueryClient } from "@tanstack/react-query";
function useAuth() {
  const queryClient = useQueryClient();
  const user = useAtomValue(authUser);
  const setAuthUser = useSetAtom(authUser);
  const { logout } = useSession();

  return {
    user,
    logout: async () => {
      await logout();
      api.resetToken();
      await supabase.auth.signOut();

      setAuthUser(null);
      myStore.set(authUser, null);
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
  };
}

export default useAuth;
