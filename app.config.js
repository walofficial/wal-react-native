const IS_DEV = process.env.EXPO_PUBLIC_IS_DEV === 'true';
// Keep app version in sync with package.json
// Expo config is executed in Node; requiring JSON here is safe and supported
const pkg = require('./package.json');

export const app_name_slug = 'wal';
export const app_name = IS_DEV ? 'WAL DEV' : 'WAL';
export default {
  expo: {
    platforms: ['ios', 'android', 'web'],
    name: app_name,
    slug: 'mnt-app',
    owner: 'nshelia',
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/images/logo-big.png',
    scheme: app_name_slug,
    userInterfaceStyle: 'automatic',
    backgroundColor: '#000000',
    updates: {
      url: 'https://u.expo.dev/a9de94ea-576e-4767-ae3f-085bfe155f96',
      enabled: true,
      fallbackToCacheTimeout: 30000,
      checkAutomatically: 'NEVER',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    newArchEnabled: false,
    ios: {
      associatedDomains: [`applinks:${app_name_slug}.ge`],
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to capture photos and videos.',
        NSPhotoLibraryUsageDescription:
          'This app accesses your photos to let you share them.',
        NSMicrophoneUsageDescription:
          'This app accesses your microphone to let you share them.',
        NSContactsUsageDescription:
          'WAL uses your contacts to help you find and connect with friends who are already using the app. Your contact data is only used for finding friends and is never stored or used for any other purpose.',
        NSLocationWhenInUseUsageDescription:
          'This app accesses your location to let you post videos or photos to nearby locations.',
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? 'com.greetai.mentdev' : 'com.greetai.ment',
      googleServicesFile: IS_DEV
        ? './GoogleService-Info.plist'
        : './GoogleService-Info-Prod.plist',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      // Check expo docs: https://docs.expo.dev/versions/latest/config/app/#softwarekeyboardlayoutmode
      softwareKeyboardLayoutMode: 'pan',
      package: IS_DEV ? 'com.greetai.mntdev' : 'com.greetai.mnt',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },

      googleServicesFile: './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: `${app_name_slug}.ge`,
              pathPrefix: '/links',
            },
            {
              scheme: 'https',
              host: `${app_name_slug}.ge`,
              pathPrefix: '/status',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: ['READ_CONTACTS'],
    },
    plugins: [
      'expo-router',
      [
        'expo-share-intent',
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsWebPageWithMaxCount: 1,
            NSExtensionActivationSupportsText: true,
            NSExtensionActivationSupportsImageWithMaxCount: 10,
          },
          androidIntentFilters: ['text/*', 'image/*'],
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
          android: {
            //LiveKit sdk requires min 24
            minSdkVersion: 24,
            targetSdkVersion: 35,
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/small-icon-android.png',
          color: '#000',
        },
      ],
      [
        'react-native-vision-camera',
        {
          cameraPermissionText:
            '$(PRODUCT_NAME) needs access to your Camera to capture photos and videos or go live.',

          // optionally, if you want to record audio:
          enableMicrophonePermission: true,
          microphonePermissionText:
            '$(PRODUCT_NAME) needs access to your Microphone to capture audio.',
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'react-native',
          organization: 'greetai-inc',
        },
      ],
      [
        'expo-location',
        {
          locationPermissionText:
            'This app accesses your location to let you post videos or photos to nearby locations.',
        },
      ],
      [
        'expo-contacts',
        {
          contactsPermission:
            'WAL needs access to your contacts to help you find friends on the app. Your contact information is only used for friend discovery and is never stored or shared.',
        },
      ],
      '@react-native-firebase/app',
      'react-native-compressor',
      [
        'expo-build-properties',
        {
          ios: {
            newArchEnabled: false,
          },
          android: {
            newArchEnabled: false,
          },
        },
      ],
      'react-native-libsodium',
      [
        'react-native-share',
        {
          ios: [
            'fb',
            'instagram',
            'whatsapp',
            'tg',
            'twitter',
            'tiktoksharesdk',
          ],
          android: [
            'com.whatsapp',
            'org.telegram.messenger',
            'com.facebook.katana',
            'com.instagram.android',
            'com.twitter.android',
            'com.zhiliaoapp.musically',
          ],
        },
      ],
      '@livekit/react-native-expo-plugin',
      '@config-plugins/react-native-webrtc',
      [
        'expo-image-picker',
        {
          photosPermission:
            '$(PRODUCT_NAME) needs access to your photos to set profile image.',
          cameraPermission:
            '$(PRODUCT_NAME) needs access to your Camera to capture photos and videos or go live on locations.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#000000',
          image: './assets/images/icon.png',
          dark: {
            image: './assets/images/icon.png',
            backgroundColor: '#000000',
          },
          imageWidth: 200,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'a9de94ea-576e-4767-ae3f-085bfe155f96',
      },
    },
  },
};
