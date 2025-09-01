'use client';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/Button';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/lib/i18n';

export default function RetryButton() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { feedId } = useLocalSearchParams<{ feedId: string }>();

  // Note: Using feedId from params
  const handleRetry = async () => {
    Alert.alert(
      'თავიდან გადაღება',
      'გუსრთ თავიდან ცდა? ეს წაშლის თავდაპირველ ჩანაწერს',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          style: 'destructive',
          text: t('common.retry'),
          onPress: async () => {
            if (feedId) {
              await AsyncStorage.removeItem(`lastRecordedVideoPath_${feedId}`);
            } else {
              await AsyncStorage.removeItem('lastRecordedVideoPath');
            }
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <Button
      onPress={handleRetry}
      icon="refresh"
      variant="outline"
      size="medium"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
