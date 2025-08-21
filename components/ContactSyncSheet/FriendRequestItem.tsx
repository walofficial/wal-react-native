import React from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { FontSizes } from "@/lib/theme";
import { useTheme } from "@/lib/theme";
import { FriendRequest, User } from "@/lib/api/generated";

interface FriendRequestItemProps {
  user: User;
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  user,
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}) => {
  const theme = useTheme();
  const imageUrl =
    user.photos && user.photos.length > 0
      ? user.photos[0].image_url[0]
      : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <Avatar
          style={[styles.avatar, { borderColor: theme.colors.border }]}
          alt="Avatar"
        >
          <View
            style={[
              styles.avatarInner,
              {
                backgroundColor: !imageUrl
                  ? theme.colors.card.background
                  : "transparent",
                borderRadius: !imageUrl ? 30 : 0,
              },
            ]}
          >
            {imageUrl ? (
              <AvatarImage
                style={styles.avatarImage}
                source={{ uri: imageUrl }}
              />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>
                {user.username?.charAt(0).toUpperCase() || ""}
              </Text>
            )}
          </View>
        </Avatar>
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {user.username || ""}
          </Text>
        </View>
      </View>
      {request.status === "pending" && request.sender_id === user.id && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onAccept(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.button.text}
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={24}
                color={theme.colors.button.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.rejectButton,
              { backgroundColor: theme.colors.accent },
            ]}
            onPress={() => onReject(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.button.text}
              />
            ) : (
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.button.text}
              />
            )}
          </TouchableOpacity>
        </View>
      )}
      {request.status === "pending" && request.sender_id !== user.id && (
        <Text style={[styles.pendingText, { color: theme.colors.text }]}>
          გაგზავნილია
        </Text>
      )}
      {request.status === "accepted" && (
        <Text style={[styles.acceptedText, { color: theme.colors.primary }]}>
          Accepted
        </Text>
      )}
      {request.status === "rejected" && (
        <Text style={[styles.rejectedText, { color: theme.colors.accent }]}>
          Rejected
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    width: "100%",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    borderWidth: 2,
    padding: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  avatarImage: {
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
  },
  usernameContainer: {
    marginLeft: 12,
  },
  username: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    fontWeight: "bold",
  },
  acceptedText: {},
  rejectedText: {},
});

export default FriendRequestItem;
