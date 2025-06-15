import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Pin } from "lucide-react-native";

function PinnedView({ imageUrl, text }: { imageUrl: string; text: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Pin fill={"gray"} size={18} style={styles.pinIcon} color="white" />
        <Text style={styles.headerText}>დაპინული</Text>
      </View>
      <View style={styles.contentContainer}>
        <Avatar style={styles.avatar} alt="Avatar">
          <AvatarImage source={{ uri: imageUrl }} style={styles.avatarImage} />
        </Avatar>
        <Text style={styles.contentText} numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#666666",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
  },
  headerContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  pinIcon: {
    marginRight: 12,
  },
  headerText: {
    color: "white",
    marginLeft: 8,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarImage: {
    borderRadius: 15,
  },
  contentText: {
    marginLeft: 12,
    color: "white",
    flex: 1,
  },
});
i;

export default PinnedView;
