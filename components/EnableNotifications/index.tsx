import React, { useState, useEffect, useRef } from "react";
import { Linking, Platform, View } from "react-native";
import { Button } from "@/components/ui/button";
import * as Notifications from "expo-notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Text } from "../ui/text";
import { isDev } from "@/lib/api/config";
import {
  registerForPushNotificationsAsync,
  sendPushNotification,
} from "@/lib/utils";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAtom } from "jotai";
import { expoPushTokenAtom, isSubscribedAtom } from "./atom";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const openNotificationSettings = () => {
  return Linking.openSettings();
};

export default function EnableNotifications({
  hidden = false,
}: {
  hidden?: boolean;
}) {
  const queryClient = useQueryClient();
  const [expoPushToken, setExpoPushToken] = useAtom(expoPushTokenAtom);
  const [isSubscribed, setIsSubscribed] = useAtom(isSubscribedAtom);
  const [userDismissed, setUserDismissed] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  const upsertFCM = useMutation({
    mutationKey: ["fcm-save"],
    mutationFn: (token: string | null) => api.upsertFCMData(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fcm-get"] });
    },
  });

  const deleteFCM = useMutation({
    mutationKey: ["fcm-delete"],
    mutationFn: (token: string) => api.deleteFCMData(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fcm-get"] });
    },
  });

  const getFcm = useQuery({
    queryKey: ["fcm-get"],
    queryFn: () => api.getFCMData(),
  });

  useEffect(() => {
    if (getFcm.data) {
      if (expoPushToken) {
        setIsSubscribed(getFcm.data.expo_push_token === expoPushToken);
      }
    }
  }, [getFcm.data, expoPushToken]);

  const enableNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      upsertFCM.mutate(token);
    }
  };

  const toggleNotifications = async () => {
    if (isSubscribed) {
      // Unsubscribe logic
      await Notifications.unregisterForNotificationsAsync();
      deleteFCM.mutate(expoPushToken);
      setUserDismissed(true);
    } else {
      // Subscribe logic
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          Alert.alert(
            "შეტყობინებების ჩართვა",
            "გადადით პარამეტრებში რომ გააქტიუროთ შეტყობინებები",
            [
              {
                text: "პარამეტრები",
                onPress: () => {
                  openNotificationSettings();
                },
              },
              {
                text: "გაუქმება",
                style: "destructive",
              },
            ]
          );
          return;
        }
        if (token) {
          setExpoPushToken(token);
          upsertFCM.mutate(token);
          setUserDismissed(false);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const router = useRouter();

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Navigate to the chat route when notification is tapped
        if (response.notification.request.content.data?.chatId) {
          router.navigate(
            `/chat/${response.notification.request.content.data.chatId}`
          );
        }
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [hidden, router, userDismissed]);

  if (hidden) return null;

  return (
    <>
      <Button
        className="my-2"
        variant={!isSubscribed ? "default" : "secondary"}
        size="lg"
        onPress={toggleNotifications}
        disabled={upsertFCM.isPending}
      >
        <Text>
          {isSubscribed ? "შეტყობინებების გამორთვა" : "შეტყობინებების ჩართვა"}
        </Text>
      </Button>
      {isDev && (
        <Button
          className="my-2"
          variant={"secondary"}
          size="lg"
          onPress={() => sendPushNotification(expoPushToken)}
          disabled={upsertFCM.isPending}
        >
          <Text>{"Test notification"}</Text>
        </Button>
      )}
      {isDev && (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Text>
            Title: {notification && notification.request.content.title}{" "}
          </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>
            Data:{" "}
            {notification && JSON.stringify(notification.request.content.data)}
          </Text>
        </View>
      )}
    </>
  );
}
