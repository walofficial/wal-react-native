import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import RegionSelector from '@/components/RegionSelector';
import LanguageSelector from '@/components/LanguageSelector';
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
            <LanguageSelector />
          </View>

          <View style={styles.selectorRow}>
            <RegionSelector />
          </View>
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
