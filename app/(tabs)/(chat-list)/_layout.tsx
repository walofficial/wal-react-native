import { Stack } from 'expo-router';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Layout() {
  const insets = useSafeAreaInsets();
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
      </View>
  );
}

export default Layout;
