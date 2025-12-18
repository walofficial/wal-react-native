import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import Button, { LIST_ICON_SIZE } from '@/components/Button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';
import useAuth from '@/hooks/useAuth';
import { useProfileInformation } from '@/hooks/useProfileInformation';
import CompanySelectorSheet from '@/components/UserPreferences/CompanySelectorSheet';
import BioEditorSheet from '@/components/UserPreferences/BioEditorSheet';
import ProfilePhotoEditSheet from '@/components/UserPreferences/ProfilePhotoEditSheet';
import ContentLanguageSelector from '@/components/ContentLanguageSelector';
import RegionSelector from '@/components/RegionSelector';
import { t } from '@/lib/i18n';

export default function UserPreferences() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const photoSheetRef = useRef<BottomSheet>(null);
  const companySheetRef = useRef<BottomSheet>(null);
  const bioSheetRef = useRef<BottomSheet>(null);

  const { data: profile } = useProfileInformation(user?.id || '');

  return (
    <>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          paddingTop: 56, // header height (SimpleGoBackHeader)
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={styles.container}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('settings.account')}
          </Text>

          <Button
            variant="list"
            fullWidth
            title={t('settings.change_photo')}
            iconElement={
              <Ionicons
                size={LIST_ICON_SIZE}
                name="image-outline"
                color={theme.colors.icon}
              />
            }
            onPress={() => photoSheetRef.current?.snapToIndex(0)}
            style={styles.button}
          />

          <Button
            variant="list"
            fullWidth
            title="Company"
            iconElement={
              <Ionicons
                size={LIST_ICON_SIZE}
                name="briefcase-outline"
                color={theme.colors.icon}
              />
            }
            onPress={() => companySheetRef.current?.snapToIndex(0)}
            style={styles.button}
          />

          <Button
            variant="list"
            fullWidth
            title="Bio"
            iconElement={
              <Ionicons
                size={LIST_ICON_SIZE}
                name="create-outline"
                color={theme.colors.icon}
              />
            }
            onPress={() => bioSheetRef.current?.snapToIndex(0)}
            style={styles.button}
          />

          <View style={{ height: 24 }} />

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('settings.language_and_region')}
          </Text>

          <View style={styles.selectorRow}>
            <ContentLanguageSelector />
          </View>
          <View style={styles.selectorRow}>
            <RegionSelector />
          </View>

          <Text
            style={[
              styles.explainer,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {t('settings.region_explanation')}
          </Text>
        </View>
      </ScrollView>

      {user?.id ? (
        <>
          <ProfilePhotoEditSheet bottomSheetRef={photoSheetRef} />
          <CompanySelectorSheet
            bottomSheetRef={companySheetRef}
            userId={user.id}
          />
          <BioEditorSheet
            bottomSheetRef={bioSheetRef}
            userId={user.id}
            initialBio={profile?.bio}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
    marginBottom: 10,
  },
  button: {
    marginBottom: 12,
  },
  selectorRow: {
    marginBottom: 12,
  },
  explainer: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
    marginTop: 8,
  },
});


