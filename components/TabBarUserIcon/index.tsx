import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useAuth from "@/hooks/useAuth";

function TabBarUserIcon() {
  const { user } = useAuth();
  return (
    <View style={[styles.container, { width: 120 }]}>
      <Link href="/user" asChild>
        <TouchableOpacity style={styles.touchable}>
          <Avatar alt="Profile image" style={styles.avatar}>
            <AvatarImage source={{ uri: user?.photos[0]?.image_url[0] }} />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  touchable: {
    padding: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TabBarUserIcon;
