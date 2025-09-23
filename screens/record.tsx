import { useEffect, useState } from 'react';
import { Camera } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import CameraPage from '@/components/CameraPage';
import { Text, View, StyleSheet } from 'react-native';
import { useToast } from '@/components/ToastUsage';
import { t } from '@/lib/i18n';
import ScreenLoader from '@/components/ScreenLoader';
import { atom, useAtom } from 'jotai';
export const permissionGrantedState = atom(false);

export default function RecordPage() {
  const router = useRouter();
  const [permissionsGranted, setPermissionsGranted] = useAtom(
    permissionGrantedState,
  );
  const { error, dismiss } = useToast();

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      if (
        cameraPermission === 'granted' &&
        microphonePermission === 'granted'
      ) {
        setPermissionsGranted(true);
      } else {
        // Redirect back if either permission is not granted
        error({
          title: t('common.permission_needed_for_photo_and_video'),
        });
        dismiss('all');
        router.back();
      }
    };

    requestPermissions();
  }, []);

  if (!permissionsGranted) {
    return <ScreenLoader />;
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
});
