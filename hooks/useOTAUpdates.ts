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
  const timeout = React.useRef<NodeJS.Timeout>();
  const { isUpdatePending } = useUpdates();

  const setCheckTimeout = React.useCallback(() => {
    timeout.current = setTimeout(async () => {
      try {
        await setExtraParams();

        console.log('Checking for update...');
        const res = await checkForUpdateAsync();

        if (res.isAvailable) {
          console.log('Attempting to fetch update...');
          await fetchUpdateAsync();
        } else {
          console.log('No update available.');
        }
      } catch (e) {
        console.error('OTA Update Error', e);
      }
    }, 10e3); // 10 seconds
  }, []);

  const onIsTestFlight = React.useCallback(async () => {
    try {
      await setExtraParams();

      const res = await checkForUpdateAsync();
      if (res.isAvailable) {
        await fetchUpdateAsync();

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
                await reloadAsync();
              },
            },
          ],
        );
      }
    } catch (e: any) {
      console.error('Internal OTA Update Error', e);
    }
  }, []);

  React.useEffect(() => {
    // Allow time for any initialization before checking for updates
    // For TestFlight users, prompt immediately when update is available
    if (IS_TESTFLIGHT) {
      onIsTestFlight();
      return;
    } else if (!shouldReceiveUpdates || ranInitialCheck.current) {
      return;
    }

    setCheckTimeout();
    ranInitialCheck.current = true;
  }, [onIsTestFlight, setCheckTimeout, shouldReceiveUpdates]);

  // After the app has been minimized for 15 minutes, either:
  // A. Install an update if one has become available
  // B. Check for an update again
  React.useEffect(() => {
    if (!isEnabled) return;

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
              await reloadAsync();
            } else {
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
      clearTimeout(timeout.current);
      subscription.remove();
    };
  }, [isUpdatePending, setCheckTimeout]);
}
