import React from 'react';
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
  await setExtraParamAsync(
    isIOS ? 'ios-build-number' : 'android-build-number',
    // Ensure build version is passed as a string
    `${nativeBuildVersion}`,
  );
  await setExtraParamAsync(
    'channel',
    IS_TESTFLIGHT ? 'testflight' : 'production',
  );
}

export function useOTAUpdates() {
  const shouldReceiveUpdates = isEnabled && !__DEV__;

  const appState = React.useRef<AppStateStatus>('active');
  const lastMinimize = React.useRef(0);
  const ranInitialCheck = React.useRef(false);
  const isCheckingRef = React.useRef(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Use the new useUpdates hook for reactive state management
  const {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    downloadedUpdate,
    checkError,
    downloadError,
  } = useUpdates();

  // Automatically reload when an update has been downloaded and is pending
  React.useEffect(() => {
    if (isUpdatePending && downloadedUpdate && !IS_TESTFLIGHT) {
      // For non-TestFlight, auto-apply on next natural restart
      // The update will be applied when the app restarts
      console.log('Update downloaded and pending, will apply on next restart');
    }
  }, [isUpdatePending, downloadedUpdate]);

  // Handle TestFlight users - prompt them when update is downloaded
  React.useEffect(() => {
    if (IS_TESTFLIGHT && isUpdatePending && downloadedUpdate) {
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
                console.error('Failed to reload after update', e);
              }
            },
          },
        ],
      );
    }
  }, [isUpdatePending, downloadedUpdate]);

  // Automatically download when an update is available
  React.useEffect(() => {
    if (isUpdateAvailable && !isDownloading && !isUpdatePending) {
      console.log('Update available, downloading...');
      fetchUpdateAsync().catch((e) => {
        console.error('Failed to fetch update', e);
      });
    }
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  // Log errors for debugging
  React.useEffect(() => {
    if (checkError) {
      console.error('Update check error:', checkError);
    }
    if (downloadError) {
      console.error('Update download error:', downloadError);
    }
  }, [checkError, downloadError]);

  const performUpdateCheck = React.useCallback(async () => {
    // Guard against multiple simultaneous checks (prevents DatabaseLauncher crash)
    if (isCheckingRef.current || isChecking || isDownloading) {
      console.log('Update check already in progress, skipping...');
      return;
    }

    try {
      isCheckingRef.current = true;
      await setExtraParams();

      console.log('Checking for update...');
      const res = await checkForUpdateAsync();

      if (res.isAvailable) {
        console.log('Update available, will be handled by useUpdates hook');
      } else {
        console.log('No update available.');
      }
    } catch (e) {
      console.error('OTA Update Error', e);
    } finally {
      isCheckingRef.current = false;
    }
  }, [isChecking, isDownloading]);

  const setCheckTimeout = React.useCallback(() => {
    // Clear any existing timeout
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      performUpdateCheck();
    }, 10e3); // 10 seconds
  }, [performUpdateCheck]);

  // Initial check on mount
  React.useEffect(() => {
    if (!shouldReceiveUpdates || ranInitialCheck.current) {
      return;
    }

    // Set extra params early for useUpdates hook
    setExtraParams().catch(console.error);

    setCheckTimeout();
    ranInitialCheck.current = true;
  }, [setCheckTimeout, shouldReceiveUpdates]);

  // After the app has been minimized for 15 minutes, either:
  // A. Install an update if one has become available
  // B. Check for an update again
  React.useEffect(() => {
    if (!isEnabled || __DEV__) return;

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // If it's been 15 minutes since the last minimize, update the client
          // since there likely isn't anything important happening in the current session
          if (lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME) {
            if (isUpdatePending) {
              try {
                await reloadAsync();
              } catch (e) {
                console.error('Failed to reload for pending update', e);
              }
            } else if (!isChecking && !isDownloading) {
              setCheckTimeout();
            }
          }
        } else {
          lastMinimize.current = Date.now();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      subscription.remove();
    };
  }, [isUpdatePending, isChecking, isDownloading, setCheckTimeout]);

  // Return useful state for consumers if needed
  return {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
  };
}
