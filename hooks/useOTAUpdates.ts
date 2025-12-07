import React, { useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { nativeBuildVersion } from 'expo-application';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates';
import { isIOS } from '@/lib/platform';
import { IS_TESTFLIGHT } from '@/lib/app-info';

const MINIMUM_MINIMIZE_TIME = 15 * 60e3; // 15 minutes

async function setExtraParams() {
  try {
    await setExtraParamAsync(
      isIOS ? 'ios-build-number' : 'android-build-number',
      `${nativeBuildVersion}`,
    );
    await setExtraParamAsync(
      'channel',
      IS_TESTFLIGHT ? 'testflight' : 'production',
    );
  } catch (e) {
    console.error('Failed to set extra params:', e);
  }
}

export function useOTAUpdates() {
  const shouldReceiveUpdates = isEnabled && !__DEV__;

  // Use the useUpdates hook for proper state management
  const {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    currentlyRunning,
    availableUpdate,
    downloadedUpdate,
    checkError,
    downloadError,
  } = useUpdates();

  const appState = useRef<AppStateStatus>('active');
  const lastMinimize = useRef(0);
  const hasCheckedOnMount = useRef(false);
  const hasShownTestFlightAlert = useRef(false);

  // Log update state changes for debugging
  useEffect(() => {
    if (__DEV__) return;

    console.log('[OTA Updates] State:', {
      isEnabled,
      isUpdateAvailable,
      isUpdatePending,
      isChecking,
      isDownloading,
      isEmbeddedLaunch: currentlyRunning?.isEmbeddedLaunch,
    });
  }, [
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    currentlyRunning,
  ]);

  // Log errors
  useEffect(() => {
    if (checkError) {
      console.error('[OTA Updates] Check error:', checkError);
    }
    if (downloadError) {
      console.error('[OTA Updates] Download error:', downloadError);
    }
  }, [checkError, downloadError]);

  // Trigger check for updates - only if not already checking/downloading
  const triggerUpdateCheck = useCallback(async () => {
    if (!shouldReceiveUpdates || isChecking || isDownloading) {
      console.log('[OTA Updates] Skipping check:', {
        shouldReceiveUpdates,
        isChecking,
        isDownloading,
      });
      return;
    }

    try {
      await setExtraParams();
      console.log('[OTA Updates] Checking for update...');
      await checkForUpdateAsync();
    } catch (e) {
      console.error('[OTA Updates] Check failed:', e);
    }
  }, [shouldReceiveUpdates, isChecking, isDownloading]);

  // When an update becomes available, download it
  useEffect(() => {
    if (!shouldReceiveUpdates) return;

    // Don't start download if already downloading or if update is already downloaded
    if (isUpdateAvailable && !isDownloading && !isUpdatePending) {
      console.log('[OTA Updates] Update available, fetching...');
      fetchUpdateAsync().catch((e) => {
        console.error('[OTA Updates] Fetch failed:', e);
      });
    }
  }, [isUpdateAvailable, isDownloading, isUpdatePending, shouldReceiveUpdates]);

  // When an update is downloaded and pending, apply it automatically (or show alert for TestFlight)
  useEffect(() => {
    if (!isUpdatePending) return;

    if (IS_TESTFLIGHT && !hasShownTestFlightAlert.current) {
      hasShownTestFlightAlert.current = true;
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Relaunch now?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Relaunch',
            style: 'default',
            onPress: async () => {
              try {
                await reloadAsync();
              } catch (e) {
                console.error('[OTA Updates] Reload failed:', e);
              }
            },
          },
        ],
      );
    }
    // For non-TestFlight builds, the update will be applied on next cold start
    // or when the app is backgrounded for > 15 minutes (see AppState handler below)
  }, [isUpdatePending]);

  // Initial check on mount with delay
  useEffect(() => {
    if (!shouldReceiveUpdates || hasCheckedOnMount.current) {
      return;
    }

    hasCheckedOnMount.current = true;

    // Delay initial check to allow app to initialize
    const timeout = setTimeout(() => {
      triggerUpdateCheck();
    }, 10e3); // 10 seconds

    return () => clearTimeout(timeout);
  }, [shouldReceiveUpdates, triggerUpdateCheck]);

  // Handle app state changes - apply pending updates or check for new ones
  useEffect(() => {
    if (!isEnabled) return;

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App came to foreground
          const timeSinceMinimize = Date.now() - lastMinimize.current;

          if (timeSinceMinimize >= MINIMUM_MINIMIZE_TIME) {
            if (isUpdatePending) {
              console.log(
                '[OTA Updates] Update pending after background, reloading...',
              );
              try {
                await reloadAsync();
              } catch (e) {
                console.error('[OTA Updates] Reload failed:', e);
              }
            } else if (!isChecking && !isDownloading) {
              // Check for updates after long background
              console.log(
                '[OTA Updates] Checking for updates after background...',
              );
              triggerUpdateCheck();
            }
          }
        } else if (nextAppState.match(/inactive|background/)) {
          // App going to background
          lastMinimize.current = Date.now();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isUpdatePending, isChecking, isDownloading, triggerUpdateCheck]);

  // Return useful state for components that might want to display update status
  return {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    currentlyRunning,
    checkForUpdate: triggerUpdateCheck,
  };
}
