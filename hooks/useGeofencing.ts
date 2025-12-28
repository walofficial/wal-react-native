import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import {
  hasGeofencingStarted,
  requestGeofencingPermissions,
  startGeofencing,
  stopGeofencing,
  type GeofencedRegion,
} from '@/lib/geofencing';

interface UseGeofencingOptions {
  /**
   * Whether to automatically start geofencing when the hook mounts
   * and permissions are granted
   */
  autoStart?: boolean;
  /**
   * Whether to restart geofencing when the app comes to foreground
   */
  restartOnForeground?: boolean;
  /**
   * Dynamic regions to monitor. When this changes, geofencing will restart
   * with the new regions.
   */
  regions?: GeofencedRegion[];
}

interface UseGeofencingResult {
  /**
   * Whether geofencing is currently active
   */
  isActive: boolean;
  /**
   * Whether geofencing is currently loading/initializing
   */
  isLoading: boolean;
  /**
   * Whether location permissions have been granted
   */
  hasPermission: boolean;
  /**
   * List of geofenced regions being monitored
   */
  regions: GeofencedRegion[];
  /**
   * Error message if something went wrong
   */
  error: string | null;
  /**
   * Request permissions and start geofencing with provided regions
   */
  start: (regions?: GeofencedRegion[]) => Promise<boolean>;
  /**
   * Stop geofencing
   */
  stop: () => Promise<boolean>;
  /**
   * Request location permissions
   */
  requestPermissions: () => Promise<boolean>;
}

/**
 * Hook to manage geofencing state and lifecycle
 *
 * @example
 * ```tsx
 * const { isActive, start, stop, hasPermission } = useGeofencing({
 *   autoStart: true,
 *   regions: dynamicRegions, // Pass regions from backend
 * });
 *
 * // Or manually control:
 * const handleEnable = async () => {
 *   await start(myRegions);
 * };
 * ```
 */
export function useGeofencing(
  options: UseGeofencingOptions = {},
): UseGeofencingResult {
  const {
    autoStart = false,
    restartOnForeground = false,
    regions: optionsRegions = [],
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRegions, setCurrentRegions] =
    useState<GeofencedRegion[]>(optionsRegions);
  const previousRegionsRef = useRef<string>('');

  // Check initial geofencing status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const started = await hasGeofencingStarted();
        setIsActive(started);
      } catch (err) {
        console.error('[useGeofencing] Error checking status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const granted = await requestGeofencingPermissions();
      setHasPermission(granted);
      if (!granted) {
        setError('Location permissions not granted');
      }
      return granted;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to request permissions';
      setError(message);
      return false;
    }
  }, []);

  // Start geofencing with provided regions
  const start = useCallback(
    async (regionsToUse?: GeofencedRegion[]): Promise<boolean> => {
      setError(null);
      setIsLoading(true);

      const regions = regionsToUse ?? currentRegions;

      try {
        // Request permissions first if not already granted
        if (!hasPermission) {
          const granted = await requestGeofencingPermissions();
          setHasPermission(granted);
          if (!granted) {
            setError('Location permissions required for geofencing');
            setIsLoading(false);
            return false;
          }
        }

        // Start geofencing with the provided regions
        const success = await startGeofencing(regions);
        setIsActive(success);

        if (success) {
          setCurrentRegions(regions);
        } else {
          setError('Failed to start geofencing');
        }

        return success;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to start geofencing';
        setError(message);
        setIsActive(false);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasPermission, currentRegions],
  );

  // Stop geofencing
  const stop = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const success = await stopGeofencing();
      if (success) {
        setIsActive(false);
      }
      return success;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to stop geofencing';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isLoading && !isActive && optionsRegions.length > 0) {
      start(optionsRegions);
    }
  }, [autoStart, isLoading, isActive, start, optionsRegions]);

  // Restart geofencing when regions change
  useEffect(() => {
    const regionsKey = JSON.stringify(
      optionsRegions
        .map((r) => `${r.identifier}:${r.latitude}:${r.longitude}:${r.radius}`)
        .sort(),
    );

    // Only restart if regions actually changed and we have regions
    if (
      regionsKey !== previousRegionsRef.current &&
      optionsRegions.length > 0
    ) {
      previousRegionsRef.current = regionsKey;

      // If geofencing is already active, restart with new regions
      if (isActive) {
        console.log(
          '[useGeofencing] Regions changed, restarting geofencing...',
        );
        start(optionsRegions);
      }
    }
  }, [optionsRegions, isActive, start]);

  // Handle app state changes for restart on foreground
  useEffect(() => {
    if (!restartOnForeground || Platform.OS === 'web') {
      return;
    }

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && hasPermission) {
        // Check if geofencing is still running
        const running = await hasGeofencingStarted();
        setIsActive(running);

        // Restart if it was supposed to be active
        if (!running && isActive && currentRegions.length > 0) {
          console.log('[useGeofencing] Restarting geofencing on foreground');
          start(currentRegions);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [restartOnForeground, hasPermission, isActive, start, currentRegions]);

  return {
    isActive,
    isLoading,
    hasPermission,
    regions: currentRegions,
    error,
    start,
    stop,
    requestPermissions,
  };
}

export default useGeofencing;
