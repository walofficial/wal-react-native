import React from 'react';
import { View, ScrollView, Linking, StyleSheet } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Image } from '@/lib/icons/Image';
import LogoutButton from '@/components/LogoutButton';
import { Ionicons } from '@expo/vector-icons';
import Button, { LIST_ICON_SIZE } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import useGetBlockedUsers from '@/hooks/useGetBlockedUsers';
import { User } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import useFeeds from '@/hooks/useFeeds';
import { t } from '@/lib/i18n';

export default function ProfileMain() {
  const { blockedUsers } = useGetBlockedUsers();
  const hasBlockedUsers = blockedUsers && blockedUsers.length > 0;
  const theme = useTheme();
  const { headerHeight } = useFeeds();
  const navigation = useRouter();

  return (
    <>
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
          { paddingTop: headerHeight },
        ]}
      >
        <View style={styles.container}>
          <SectionHeader
            icon={
              <Ionicons
                size={28}
                name="person-outline"
                color={theme.colors.icon}
              />
            }
            text={t('settings.general')}
          />

          <Button
            variant="list"
            fullWidth
            title={t('settings.change_photo')}
            iconElement={
              <Image size={LIST_ICON_SIZE} color={theme.colors.icon} />
            }
            onPress={() => navigation.navigate('/(tabs)/(user)/change-photo')}
            style={styles.settingsButton}
          />

          <Button
            variant="list"
            fullWidth
            title={t('settings.account')}
            iconElement={
              <User size={LIST_ICON_SIZE} color={theme.colors.icon} />
            }
            onPress={() =>
              navigation.navigate('/(tabs)/(user)/profile-settings')
            }
            style={styles.settingsButton}
          />

          <Button
            variant="list"
            fullWidth
            title={t('settings.language_and_region')}
            icon="globe-outline"
            iconColor={theme.colors.icon}
            onPress={() =>
              navigation.navigate('/(tabs)/(user)/language-region')
            }
            style={styles.settingsButton}
          />
        </View>
      </ScrollView>
      <View
        style={[
          styles.bottomContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {hasBlockedUsers && (
          <Button
            variant="list"
            fullWidth
            title={t('settings.blocked_users')}
            icon="person-outline"
            iconColor={theme.colors.icon}
            onPress={() => router.navigate('/(tabs)/(user)/blocked-users')}
            style={styles.settingsButton}
          />
        )}
        <LogoutButton />
        <View style={styles.footerLinks}>
          <Button
            variant="subtle"
            title={t('settings.terms_of_service')}
            onPress={() => Linking.openURL('https://greetai.co/terms')}
            style={styles.footerLink}
          />
          <Button
            variant="subtle"
            title={t('settings.privacy_policy')}
            onPress={() => Linking.openURL('https://greetai.co/policy')}
            style={styles.footerLink}
          />
        </View>
      </View>

      {/* <Button
              onClick={() => {
                AsyncStorage.clear();
              }}
            >
        <Text>Clear Async Storage</Text>
      </Button> */}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  settingsButton: {
    marginBottom: 12,
  },
  bottomContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    padding: 20,
    width: '100%',
  },
  footerLinks: {
    flexDirection: 'row',
  },
  footerLink: {
    marginRight: 8,
    minWidth: 'auto',
  },
});
