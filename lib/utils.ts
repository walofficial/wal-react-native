import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { LocationFeedPost, Task, UserVerification } from "./interfaces";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MAX_CARD_HEIGHT_STYLE_PROP = 600;
export const CARD_HEIGHT_STYLE_PROMPT = 300;
export const CARD_MIN_HEIGHT = 300;

export async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
    // add topic
    topic: "test",
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  // Log response

  console.log(response.json());
  console.log(response.body);
  console.log(response.status);
  console.log(response.statusText);
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    // handleRegistrationError("Must use physical device for push notifications");
  }
}

export const isExampleSourceImage = (task: Task) => {
  if (!task.task_verification_example_sources[0]) {
    return false;
  }
  return task.task_verification_example_sources[0].media_type.includes("image");
};

export const itemHeightCoeff = 0.45;

export const convertToCDNUrl = (url: string) => {
  return url
    .replace(
      "https://storage.cloud.google.com/ment-verification/",
      "https://cdn.ment.ge/"
    )
    .replace(
      "https://storage.googleapis.com/ment-verification/",
      "https://cdn.ment.ge/"
    );
};

export const getVideoSrc = (
  verification: UserVerification | LocationFeedPost
) => {
  if (verification.verified_image) {
    return "";
  }
  const streamSrc =
    Platform.OS === "ios"
      ? verification?.verified_media_playback?.hls
      : verification?.verified_media_playback?.dash;
  const mp4Source = verification?.verified_media_playback?.mp4;

  const shouldStream = verification?.state === "READY_FOR_USE";

  return shouldStream ? streamSrc || mp4Source : mp4Source;
};
