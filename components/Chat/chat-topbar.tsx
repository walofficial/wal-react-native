import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Image } from "expo-image";

import { isChatUserOnlineState } from "@/lib/state/chat";
import { useAtom } from "jotai";
import { Pressable, TouchableOpacity, View, StyleSheet } from "react-native";
import { Skeleton } from "../ui/skeleton";
import { Text } from "../ui/text";
import { router, useGlobalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/lib/theme";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnUI,
} from "react-native-reanimated";
import { MenuView } from "@react-native-menu/menu";
import { useFriendRequest } from "@/lib/hooks/useFriendRequest";
import { Platform } from "react-native";
import useMessageRoom from "@/hooks/useMessageRoom";
import useAuth from "@/hooks/useAuth";
import usePokeLiveUser from "@/hooks/usePokeUser";
import { User } from "lucide-react-native";

export default function ChatTopbar() {
  const { roomId, feedId } = useGlobalSearchParams<{
    roomId: string;
    feedId: string;
  }>();
  const { room, isFetching } = useMessageRoom(roomId);
  const { user } = useAuth();
  const theme = useTheme();

  const [isChatUserOnline, setIsChatUserOnline] = useAtom(
    isChatUserOnlineState
  );

  const selectedUser = room?.participants.find((p) => p.id !== user.id);

  const userPhoto = selectedUser?.photos[0]?.image_url[0];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const {
    mutate: sendFriendRequest,
    isSuccess,
    isPending: isSendingFriendRequest,
  } = useFriendRequest();

  useEffect(() => {
    if (isChatUserOnline) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
      scale.value = withTiming(1, { duration: 300, easing: Easing.elastic(1) });
    } else {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
      scale.value = withTiming(0.8, { duration: 300, easing: Easing.ease });
    }
  }, [isChatUserOnline]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleAddFriend = () => {
    if (selectedUser) {
      sendFriendRequest({
        body: {
          target_user_id: selectedUser.id,
        },
      });
    }
  };

  const { pokeLiveUser } = usePokeLiveUser();

  const handlePoke = () => {
    if (selectedUser) {
      pokeLiveUser.mutate({
        path: {
          target_user_id: selectedUser.id,
        },
      });
    }
  };

  const menuItems = [
    {
      id: "poke",
      title: "უჯიკე",
      imageColor: theme.colors.primary,
    },
    {
      id: "addFriend",
      title: "მეგობრად დამატება",
      image: Platform.select({
        ios: "person.badge.plus",
        android: "ic_menu_add_gray",
      }),
      imageColor: theme.colors.primary,
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate({
                pathname: "/(tabs)/(home)",
              });
            }
          } catch (error) {
            router.navigate({
              pathname: "/(tabs)/(home)",
            });
          }
        }}
      >
        <Ionicons name="chevron-back" size={30} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.contentContainer}>
        <View style={styles.userInfoContainer}>
          <Pressable
            onPress={() => {
              if (userPhoto) {
                router.navigate({
                  pathname: "/(tabs)/(home)/profile-picture",
                  params: {
                    feedId: feedId,
                    roomId: roomId,
                    imageUrl: userPhoto,
                  },
                });
              }
            }}
          >
            <View style={styles.avatarContainer}>
              <Avatar
                style={styles.avatar}
                alt={selectedUser?.username || "User avatar"}
              >
                {userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={styles.avatarImage}
                    transition={300}
                  />
                ) : (
                  <AvatarFallback>
                    <User
                      size={30}
                      color={
                        theme.colors.text === "#000000" ? "#9ca3af" : "#9ca3af"
                      }
                    />
                  </AvatarFallback>
                )}
              </Avatar>
              <Animated.View
                style={[
                  styles.onlineIndicator,
                  animatedStyle,
                  {
                    borderColor:
                      theme.colors.text === "#000000" ? "#FFFFFF" : "#000000",
                  },
                ]}
              />
            </View>
          </Pressable>
          <View style={styles.usernameContainer}>
            {selectedUser?.username ? (
              <Text
                style={[styles.username, { color: theme.colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedUser?.username}
              </Text>
            ) : (
              <Skeleton
                style={[
                  styles.skeletonLoader,
                  {
                    backgroundColor:
                      theme.colors.text === "#000000" ? "#e5e7eb" : "#1f2937",
                  },
                ]}
              />
            )}
          </View>
        </View>
        <View style={styles.menuContainer}>
          <MenuView
            title="რა გსურთ?"
            onPressAction={({ nativeEvent }) => {
              requestAnimationFrame(() => {
                runOnUI(() => {});
                if (nativeEvent.event === "addFriend") {
                  handleAddFriend();
                } else if (nativeEvent.event === "poke") {
                  handlePoke();
                }
              });
            }}
            themeVariant={theme.colors.text === "#000000" ? "light" : "dark"}
            actions={menuItems}
          >
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons
                name="ellipsis-vertical"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </MenuView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  backButton: {
    marginRight: 20,
    paddingRight: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: 16,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    backgroundColor: "#1f2937",
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usernameContainer: {
    flexDirection: "column",
    marginLeft: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
  },
  skeletonLoader: {
    width: 128,
    height: 16,
    backgroundColor: "#1f2937",
  },
  menuContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    padding: 16,
  },
});
