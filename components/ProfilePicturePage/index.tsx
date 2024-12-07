import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { convertToCDNUrl } from "@/lib/utils";
import useLiveUser from "@/hooks/useLiveUser";
import useAuth from "@/hooks/useAuth";

const ProfilePicture = ({
  showMessageOption = false,
}: {
  showMessageOption?: boolean;
}) => {
  const { imageUrl, userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { joinChat } = useLiveUser();
  const { user } = useAuth();
  const isAuthor = user?.id === userId;
  return (
    <SafeAreaView style={[styles.container]}>
      <View
        className="absolute top-0 left-0 right-0 flex-row justify-between z-40 px-5"
        style={{ top: insets.top + 20 }}
      >
        <Pressable
          hitSlop={20}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        {showMessageOption && !isAuthor && (
          <Pressable
            disabled={joinChat.isPending}
            hitSlop={20}
            onPress={() => {
              router.back();
              joinChat.mutate({ targetUserId: userId as string });
            }}
          >
            {joinChat.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="chatbubble" size={24} color="white" />
            )}
          </Pressable>
        )}
      </View>
      <Image
        source={{ uri: convertToCDNUrl(imageUrl as string) }}
        style={styles.image}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 20,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default ProfilePicture;
