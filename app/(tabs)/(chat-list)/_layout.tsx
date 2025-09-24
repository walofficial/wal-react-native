import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContactSyncSheet from '@/components/ContactSyncSheet';
import { useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';

function Layout() {
  const insets = useSafeAreaInsets();
  const contactSyncSheetRef = useRef<BottomSheet>(null);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'ჩათი',
            header: () => <SimpleGoBackHeader title="ჩათი" hideBackButton />,
          }}
        />
      </Stack>
      <ContactSyncSheet bottomSheetRef={contactSyncSheetRef} />
    </View>
  );
}

export default Layout;
