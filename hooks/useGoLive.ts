import { useMutation } from "@tanstack/react-query";
import { Platform } from "react-native";
import api from "@/lib/api";
import { isWeb } from "@/lib/platform";

function useGoLive() {
  const goLiveMutation = useMutation({
    onMutate: (taskId: string) => {
      // Skip onMutate logic for web platform
      if (isWeb) {
        throw new Error("Go live is not supported on web");
      }

      // ... existing onMutate logic for mobile platforms
    },
    mutationFn: (taskId: string) => api.goLive(taskId),
    onSuccess: (res, taskId) => {},
  });

  return {
    goLiveMutation,
  };
}

export default useGoLive;
