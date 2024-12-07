import { useEffect, useState } from "react";
import { Camera } from "react-native-vision-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import CameraPage from "@/components/CameraPage";
import { Text, View } from "react-native";
import IsInLocation from "@/components/IsInLocation";
import { toast } from "@backpackapp-io/react-native-toast";

export default function RecordPage() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const [showCamera, setShowCamera] = useState(true);
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
      <View className="flex-1 justify-center items-center">
        <Text>
          საჭიროა ნება დართოთ ვიდეოსა და ფოტოს გადაღებას აპლიკაციას
          პარამეტრებიდან
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 relative">
      <CameraPage showCamera={showCamera} />
    </View>
  );
}
