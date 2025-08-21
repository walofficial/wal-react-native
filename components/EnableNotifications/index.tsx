import React, { useState, useEffect, useRef } from "react";
import { Linking, Platform, View, StyleSheet } from "react-native";
import Button from "@/components/Button";
import * as Notifications from "expo-notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  deleteFcmMutation,
  getFcmTokenOptions,
  getFcmTokenQueryKey,
  upsertFcmMutation,
} from "@/lib/api/generated/@tanstack/react-query.gen";
import { t } from "@/lib/i18n";

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

  const saveToken = useMutation({
    ...upsertFcmMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getFcmTokenQueryKey() });
    },
  });

  const deleteFCM = useMutation({
    ...deleteFcmMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getFcmTokenQueryKey() });
    },
  });

  const getFcm = useQuery({
    ...getFcmTokenOptions(),
  });

  useEffect(() => {
    if (getFcm.data) {
      if (expoPushToken) {
        setIsSubscribed(getFcm.data.expo_push_token === expoPushToken);
      }
    }
  }, [getFcm.data, expoPushToken]);

  const toggleNotifications = async () => {
    if (isSubscribed) {
      // Unsubscribe logic
      await Notifications.unregisterForNotificationsAsync();
      deleteFCM.mutate({});
      setUserDismissed(true);
    } else {
      // Subscribe logic
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          Alert.alert(
            t("common.enable_notifications"),
            t("common.go_to_settings_enable_notifications"),
            [
              {
                text: t("common.settings"),
                onPress: () => {
                  openNotificationSettings();
                },
              },
              {
                text: t("common.cancel"),
                style: "destructive",
              },
            ]
          );
          return;
        }
        if (token) {
          setExpoPushToken(token);
          saveToken.mutate({
            body: {
              expo_push_token: token,
            } as any,
          });
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
        glassy={true}
        style={styles.button}
        variant={!isSubscribed ? "default" : "secondary"}
        size="large"
        onPress={toggleNotifications}
        disabled={saveToken.isPending}
        loading={saveToken.isPending}
        title={
          isSubscribed
            ? t("common.disable_notifications")
            : t("common.enable_notifications")
        }
        icon={
          isSubscribed ? "notifications-off-outline" : "notifications-outline"
        }
      />
      {isDev && (
        <Button
          glassy={true}
          style={styles.button}
          variant="secondary"
          size="large"
          onPress={() => sendPushNotification(expoPushToken)}
          disabled={saveToken.isPending}
          title={"Test notification"}
        />
      )}
      {isDev && (
        <View style={styles.devContainer}>
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

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
  devContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
