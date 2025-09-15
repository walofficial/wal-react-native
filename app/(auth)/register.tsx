import RegisterView from '@/components/RegisterView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { isUserRegistered, useSession } from '@/components/AuthLayer';
import { Redirect, router } from 'expo-router';

export default function Register() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user } = useSession();
  if (user && isUserRegistered(user)) {
    return <Redirect href="/(tabs)/(news)" />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: insets.bottom,
        paddingTop: insets.top + 20,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <RegisterView />
    </View>
  );
}
