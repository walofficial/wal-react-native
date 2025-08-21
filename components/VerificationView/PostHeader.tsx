import React, { useCallback, memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/date";
import { FontSizes, useTheme } from "@/lib/theme";

interface PostHeaderProps {
  name: string;
  time: string;
  avatarUrl: string;
  posterId: string;
  headerHeight: number;
  hasFactCheck?: boolean;
  isLive?: boolean;
}

const PostHeader = memo(
  ({
    name,
    time,
    avatarUrl,
    posterId,
    headerHeight,
    hasFactCheck,
    isLive,
  }: PostHeaderProps) => {
    const router = useRouter();
    const theme = useTheme();
    const pathname = usePathname();
    const isNotTransparent = pathname.includes("status");
    const formattedTime = formatRelativeTime(time);

    const handleProfilePress = useCallback(() => {
      router.navigate({
        pathname: `/(tabs)/(home)/profile`,
        params: { userId: posterId },
      });
    }, [posterId, router]);

    return (
      <View
        style={[
          styles.headerContainer,
          { paddingTop: !isNotTransparent ? headerHeight : 0 },
        ]}
      >
        <View style={styles.headerWrapper}>
          <Pressable onPress={handleProfilePress} style={styles.avatarWrapper}>
            <Avatar alt="Avatar" style={styles.avatar}>
              <AvatarImage
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            </Avatar>
            {isLive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.headerContent}>
            <View style={styles.nameTimeContainer}>
              <Text style={[styles.nameText, { color: theme.colors.text }]}>
                {name}
              </Text>
              <Text style={[styles.timeText, { color: "rgb(101, 104, 108)" }]}>
                · {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

PostHeader.displayName = "PostHeader";

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 6,
    paddingVertical: 12,
    position: "relative",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 35,
    borderColor: "transparent",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  nameTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  factCheckBadgePosition: {
    position: "absolute",
    top: -24,
    left: 0,
    zIndex: 10,
  },
  liveIndicator: {
    position: "absolute",
    bottom: -5,
    alignItems: "center",
    backgroundColor: "#FF0000",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    width: 40,
    left: 5, // Position it properly
  },
  liveText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default PostHeader;
