import React from "react";
import { View, StyleSheet } from "react-native";
import { useProfileInformation } from "@/hooks/useProfileInformation";
import { convertToCDNUrl } from "@/lib/utils";
import UserCircleProfile from "../UserCircleProfile";
import { spacing } from "@/utils/styleUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const {
    data: profile,
    isLoading,
    isFetching,
  } = useProfileInformation(userId);
  const isLoadingData = isLoading || isFetching;

  if (!profile && !isLoadingData) {
    return null;
  }

  return (
    <>
      <UserCircleProfile
        photo={
          isLoadingData
            ? undefined
            : convertToCDNUrl(profile?.photos[0].image_url[0] || "")
        }
        userId={userId}
      />
    </>
  );
}

function StatCard({
  title,
  value,
  iconName,
  iconColor,
  theme,
}: {
  title: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  theme: any;
}) {
  const backgroundColor =
    theme.colors.background === "#000000"
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.05)";

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.colors.feedItem.background },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <Text
        style={[
          styles.statTitle,
          { color: theme.colors.feedItem.secondaryText },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  statCard: {
    borderRadius: 12,
    padding: spacing[4],
    alignItems: "center",
    flex: 1,
    marginHorizontal: spacing[2],
  },
  iconContainer: {
    marginBottom: spacing[3],
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 14,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
});
