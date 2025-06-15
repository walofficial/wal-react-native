import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Avatar } from "../ui/avatar";
import ImageLoader from "../ImageLoader";
import { useRouter } from "expo-router";
import useAuth from "@/hooks/useAuth";

function UserCircleProfile({
  photo,
  userId,
}: {
  photo?: string;
  userId: string;
}) {
  const { user } = useAuth();
  const isAuthUser = user?.id === userId;
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          if (isAuthUser) {
            router.navigate("/(tabs)/(user)/change-photo");
          } else {
            router.navigate({
              pathname: "/(tabs)/(home)/profile-picture",
              params: {
                userId,
                imageUrl: photo,
              },
            });
          }
        }}
      >
        <Avatar alt="User photo" style={styles.avatar}>
          {photo ? (
            <ImageLoader
              aspectRatio={1 / 1}
              source={{ uri: photo }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </Avatar>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    flex: 1,
    borderRadius: 9999,
    marginBottom: 20,
    flexDirection: "row",
    width: 128,
    height: 128,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 128,
    height: 128,
    borderRadius: 9999,
  },
  placeholderImage: {
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: "#3A3A3C",
  },
});

export default UserCircleProfile;
