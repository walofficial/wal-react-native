'use client';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/Button';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function RetryButton() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const theme = useTheme();

  const isDarkMode = theme.colors.text === '#FFFFFF';
  const iconTint = isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const surfaceBg = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const surfaceBorder = isDarkMode
    ? 'rgba(255,255,255,0.18)'
    : 'rgba(0,0,0,0.12)';

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
      variant="subtle"
      size="medium"
      iconColor={iconTint}
      style={[
        styles.button,
        {
          backgroundColor: surfaceBg,
          borderColor: surfaceBorder,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
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
