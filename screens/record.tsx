import { useEffect, useState } from "react";
import { Camera } from "react-native-vision-camera";
import { useRouter } from "expo-router";
import CameraPage from "@/components/CameraPage";
import { Text, View, StyleSheet } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";

export default function RecordPage() {
  const router = useRouter();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      if (
        cameraPermission === "granted" &&
        microphonePermission === "granted"
      ) {
        setPermissionsGranted(true);
      } else {
        // Redirect back if either permission is not granted
        toast.error(
          "საჭიროა ნება დართოთ ვიდეოსა და ფოტოს გადაღებაზე აპლიკაციას პარამეტრებიდან"
        );
        router.back();
      }
    };

    requestPermissions();
  }, []);

  if (!permissionsGranted) {
    return (
      <View style={styles.centered}>
        <Text>
          საჭიროა ნება დართოთ ვიდეოსა და ფოტოს გადაღებას აპლიკაციას
          პარამეტრებიდან
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraPage />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    position: "relative",
  },
});
