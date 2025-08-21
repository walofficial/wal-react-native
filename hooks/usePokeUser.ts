import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";
import { pokeUserLiveActionsPokeTargetUserIdPostMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";

function usePokeLiveUser() {
  const { success } = useToast()

  const pokeLiveUser = useMutation({
    ...pokeUserLiveActionsPokeTargetUserIdPostMutation(),
    onSuccess: (data, variables) => {
      success({ title: "შეზანზარდა" });
    },
  });
  return { pokeLiveUser };
}

export default usePokeLiveUser;
