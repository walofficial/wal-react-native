import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@backpackapp-io/react-native-toast";

function usePokeLiveUser() {
  const pokeLiveUser = useMutation({
    mutationFn: (variables: { userId: string; taskId: string }) =>
      api.pokeLiveUser(variables.userId, variables.taskId),
    onSuccess: (data, variables) => {
      toast.success("შეზანზარდა");
    },
  });
  return { pokeLiveUser };
}

export default usePokeLiveUser;
