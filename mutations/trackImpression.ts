import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

// Cache to store the last tracked time for each verification ID
const impressionCache: Record<string, number> = {};
const COOLDOWN_PERIOD = 60000; // 60 seconds cooldown period

export const useTrackImpression = () => {
  return useMutation({
    mutationKey: ["track-impression"],
    mutationFn: (verificationId: string) => {
      const now = Date.now();
      const lastTracked = impressionCache[verificationId] || 0;

      // Check if the cooldown period has passed
      if (now - lastTracked < COOLDOWN_PERIOD) {
        return Promise.resolve(); // Skip tracking if within cooldown
      }

      // Update the cache with the current timestamp
      impressionCache[verificationId] = now;

      // Proceed with tracking the impression
      return api.trackImpression(verificationId);
    },
  });
};
