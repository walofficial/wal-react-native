// @ts-nocheck

import '@react-native-firebase/app';
import React, { useEffect } from 'react';
import remoteConfig from '@react-native-firebase/remote-config';
import { useAtom } from 'jotai';
import { firebaseRemoteConfigState } from '../../lib/state/storage';
import { isDev } from '@/lib/api/config';
import { nativeApplicationVersion } from 'expo-application';
import { Dimensions, StyleSheet, View } from 'react-native';
import { H1 } from '../ui/typography';
import { Text } from '../ui/text';
import { Portal } from '../primitives/portal';

const RemoteConfigBanner = () => {
  // Don't show banner in dev environment
  if (isDev) return null;

  const [remoteConfigData, setRemoteConfigData] = useAtom(
    firebaseRemoteConfigState,
  );
  useEffect(() => {
    const fetchAndActivateConfig = async () => {
      try {
        await remoteConfig().setDefaults({
          mentbanner: JSON.stringify({
            type: 'info',
            message: 'Default message',
            canBeHidden: true,
          }),
        });

        await remoteConfig().fetchAndActivate();

        const updateConfig = () => {
          const configValue = remoteConfig().getString('showbanner');

          if (!configValue) return setRemoteConfigData(null);
          const parsedConfig = JSON.parse(configValue);
          setRemoteConfigData(parsedConfig);
        };

        // Initial update
        updateConfig();

        // Listen for remote config updates
        remoteConfig().onConfigUpdated(async () => {
          await remoteConfig().activate();
          updateConfig();
        });
      } catch (error) {
        console.error('Error fetching remote config:', error);
      }
    };

    fetchAndActivateConfig();
  }, [setRemoteConfigData]);
  if (!remoteConfigData) return null;
  const onlyForSpecificVersion = remoteConfigData.native_application_version;
  if (onlyForSpecificVersion) {
    const appVersion = nativeApplicationVersion;
    // Compare versions and show banner for current and lower versions
    const currentVersionParts = appVersion.split('.').map(Number);
    const targetVersionParts = onlyForSpecificVersion.split('.').map(Number);

    // Compare version numbers
    for (
      let i = 0;
      i < Math.max(currentVersionParts.length, targetVersionParts.length);
      i++
    ) {
      const current = currentVersionParts[i] || 0;
      const target = targetVersionParts[i] || 0;
      if (current > target) {
        return null;
      }
      if (current < target) {
        break;
      }
    }
  }

  /*

  There can be two types of messages:
  1. Message with native_application_version
  2. Or for all versions


  {
  "type": "error",
  "message": "მიმდინარეობას ტექნიკური სამუშაოები"
}

{
  "type": "error",
  "message": "მიმდინარეობას ტექნიკური სამუშაოები"
  "native_application_version": "1.0.17"
}
*/
  if (remoteConfigData) {
    return (
      <Portal name="remote-config-banner">
        <View
          style={[
            styles.container,
            {
              padding: 16,
            },
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.messageContainer}>
              <H1 style={styles.title}>WAL</H1>
              <Text style={styles.message}>
                {remoteConfigData.message ?? 'გამარჯობა'}
              </Text>
            </View>
          </View>
        </View>
      </Portal>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  messageContainer: {
    padding: 16,
    textAlign: 'center',
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default RemoteConfigBanner;
