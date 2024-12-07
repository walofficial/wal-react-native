const IS_DEV = process.env.EXPO_PUBLIC_IS_DEV === "true";

export default {
  expo: {
    platforms: ["ios", "android"],
    name: "MNT",
    slug: "mnt-app",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/images/logo-big.png",
    scheme: "ment",
    userInterfaceStyle: "dark",
    backgroundColor: "#000000",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#000",
    },
    updates: {
      url: "https://u.expo.dev/a9de94ea-576e-4767-ae3f-085bfe155f96",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    ios: {
      associatedDomains: ["applinks:ment.ge"],
      infoPlist: {
        NSCameraUsageDescription:
          "This app uses the camera to capture photos and videos.",
        NSPhotoLibraryUsageDescription:
          "This app accesses your photos to let you share them.",
        NSMicrophoneUsageDescription:
          "This app accesses your microphone to let you share them.",
        NSContactsUsageDescription:
          "MNT uses your contacts to help you find and connect with friends who are already using the app. Your contact data is only used for finding friends and is never stored or used for any other purpose.",
        NSLocationWhenInUseUsageDescription:
          "This app accesses your location to let you post videos or photos to nearby locations.",
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? "com.greetai.mentdev" : "com.greetai.ment",
      googleServicesFile: IS_DEV
        ? "./GoogleService-Info.plist"
        : "./GoogleService-Info-Prod.plist",
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.greetai.ment.widget",
        ],
      },
    },
    assetBundlePatterns: ["**/*"],
    android: {
      package: IS_DEV ? "com.greetai.mntdev" : "com.greetai.mnt",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },

      googleServicesFile: "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "ment.ge",
              pathPrefix: "/links",
            },
            {
              scheme: "https",
              host: "ment.ge",
              pathPrefix: "/status",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      permissions: ["android.permission.READ_CONTACTS"],
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon.png",
          color: "#000",
        },
      ],
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: "$(PRODUCT_NAME) needs access to your Camera.",

          // optionally, if you want to record audio:
          enableMicrophonePermission: true,
          microphonePermissionText:
            "$(PRODUCT_NAME) needs access to your Microphone.",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "react-native",
          organization: "greetai-inc",
        },
      ],
      [
        "expo-location",
        {
          locationPermissionText:
            "This app accesses your location to let you post videos or photos to nearby locations.",
        },
      ],
      [
        "expo-contacts",
        {
          contactsPermission:
            "MNT needs access to your contacts to help you find friends on the app. Your contact information is only used for friend discovery and is never stored or shared.",
        },
      ],
      "@react-native-firebase/app",
      "react-native-compressor",
      // [
      //   "expo-build-properties",
      //   {
      //     ios: {
      //       newArchEnabled: true,
      //     },
      //     android: {
      //       newArchEnabled: true,
      //     },
      //   },
      // ],
      "expo-video",
      "react-native-libsodium",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "a9de94ea-576e-4767-ae3f-085bfe155f96",
      },
    },
  },
};
