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
import EnableNotifications from '@/components/EnableNotifications';

export default function UserPreferences() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
        ]}
        contentContainerStyle={{
          paddingTop: 56, // header height (SimpleGoBackHeader)
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={styles.container}>
          <EnableNotifications />
          <View style={{ height: 24 }} />

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
