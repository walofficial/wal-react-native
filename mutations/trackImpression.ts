// @ts-nocheck
import { useMutation } from '@tanstack/react-query';
import { trackImpressionsMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

// Cache to store the last tracked time for each verification ID
const impressionCache: Record<string, number> = {};
const COOLDOWN_PERIOD = 60000; // 60 seconds cooldown period

export const useTrackImpression = () => {
  return useMutation({
    ...trackImpressionsMutation(),
    mutationKey: ['track-impression'],
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
      return (trackImpressionsMutation().mutationFn as any)({
        path: { verification_id: verificationId },
      });
    },
  });
};
