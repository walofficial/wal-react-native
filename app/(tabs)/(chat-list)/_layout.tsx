import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContactSyncSheet from '@/components/ContactSyncSheet';
import { useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

function Layout() {
  const insets = useSafeAreaInsets();
  const contactSyncSheetRef = useRef<BottomSheet>(null);
  const theme = useTheme();
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
            header: () => (
              <SimpleGoBackHeader
                title="ჩათი"
                hideBackButton
                rightSection={
                  <TouchableOpacity
                    style={{ marginRight: 10, marginTop: 5 }}
                    onPress={() => contactSyncSheetRef.current?.expand()}
                  >
                    <Ionicons name="add-circle" size={40} color={theme.colors.text} />
                  </TouchableOpacity>
                }
              />
            ),
          }}
        />
      </Stack>
      <ContactSyncSheet bottomSheetRef={contactSyncSheetRef} />
    </View>
  );
}

export default Layout;
