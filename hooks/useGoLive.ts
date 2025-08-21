// @ts-nocheck
import { useMutation } from "@tanstack/react-query";
import { Platform } from "react-native";
import { isWeb } from "@/lib/platform";
import { goLiveMutation } from "@/lib/api/generated/@tanstack/react-query.gen";

function useGoLive() {
  const goLiveMutationHook = useMutation({
    ...goLiveMutation(),
    onMutate: (feedId: string) => {
      // Skip onMutate logic for web platform
      if (isWeb) {
        throw new Error("Go live is not supported on web");
      }

      // ... existing onMutate logic for mobile platforms
    },
    onSuccess: (res, feedId) => { },
  });

  return {
    goLiveMutation: goLiveMutationHook,
  };
}

export default useGoLive;
