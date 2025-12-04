'use client';
import { Alert, StyleSheet } from 'react-native';
import { LogOut } from '@/lib/icons/LogOut';
import useAuth from '@/hooks/useAuth';
import Button, { LIST_ICON_SIZE } from '../Button';
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
    <Button
      variant="list"
      fullWidth
      title={t('common.logout')}
      iconElement={<LogOut size={LIST_ICON_SIZE} color={theme.colors.accent} />}
      onPress={confirmLogout}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 12,
  },
});
