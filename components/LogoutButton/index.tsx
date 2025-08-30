'use client';
import { Alert, StyleSheet } from 'react-native';
import { LogOut } from '@/lib/icons/LogOut';
import { Text } from '../ui/text';
import useAuth from '@/hooks/useAuth';
import AnimatedPressable from '../AnimatedPressable';
import ProtocolService from '@/lib/services/ProtocolService';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

export default function LogoutButton() {
  const auth = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    await ProtocolService.clearKeys();
    await auth.logout();
  };

  const confirmLogout = () => {
    Alert.alert(
      t('common.confirm_logout_title'),
      t('common.confirm_logout_description'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: handleLogout,
        },
      ],
    );
  };

  return (
    <AnimatedPressable onClick={confirmLogout}>
      <LogOut color={theme.colors.accent} />
      <Text style={[styles.text, { color: theme.colors.text }]}>
        {t('common.logout')}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  text: {
    marginLeft: 16,
  },
  button: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 24,
    borderRadius: 12,
  },
});
