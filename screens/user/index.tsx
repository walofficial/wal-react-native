import { View, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import UserGNContentProfile from '@/components/UserGNContentProfile';
import { SectionHeader } from '@/components/SectionHeader';
import useAuth from '@/hooks/useAuth';
import ProfileView from '@/components/ProfileView';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

export default function ProfileMain() {
  const { user } = useAuth();
  const theme = useTheme();
  return (
    <>
      <UserGNContentProfile
        userId={user?.id}
        topHeader={
          <>
            <ProfileView userId={user?.id} />
            <View style={styles.container}>
              <View style={styles.sectionContainer}>
                <SectionHeader
                  icon={
                    <Ionicons
                      size={26}
                      name="time-outline"
                      color={theme.colors.icon}
                    />
                  }
                  text={t('common.history')}
                />
              </View>
            </View>
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  buttonText: {
    marginLeft: 16,
  },
  friendButton: {
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
