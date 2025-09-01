import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Photos from '@/components/Photos';

export default function RegisterPhotos() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View
        style={{
          padding: 20,
          flex: 1,
        }}
      >
        <Photos redirectURL="/(tabs)/(home)" />
      </View>
    </View>
  );
}
