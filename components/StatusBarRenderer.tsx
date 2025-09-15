import { useColorScheme } from '@/lib/useColorScheme';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLightbox } from '@/lib/lightbox/lightbox';

function StatusBarRenderer() {
  const { colorScheme } = useColorScheme();
  const { activeLightbox } = useLightbox();
  if (activeLightbox) {
    return null;
  }
  return (
    Platform.OS === 'android' && (
      <StatusBar
        backgroundColor={colorScheme === 'dark' ? 'black' : '#efefef'}
        style={colorScheme === 'dark' ? 'light' : 'dark'}
      />
    )
  );
}

export default StatusBarRenderer;
