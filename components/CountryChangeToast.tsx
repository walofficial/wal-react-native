import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { getFlagUrl } from '@/lib/countries';
import { t } from '@/lib/i18n';

interface CountryChangeToastProps {
  countryCode: string; // ISO like FR, GE
  countryName?: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  onPress?: () => void; // toast clickable
}

export const CountryChangeToast: React.FC<CountryChangeToastProps> = ({
  countryCode,
  countryName,
  onAccept,
  onDismiss,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Image source={{ uri: getFlagUrl(countryCode) }} style={styles.flag} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('common.country_change')}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.pillButton, styles.dismiss]}
          accessibilityLabel="Dismiss"
        >
          <Text style={styles.pillText}>×</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          style={[styles.pillButton, styles.accept]}
          accessibilityLabel="Accept"
        >
          <Text style={styles.pillText}>{t('common.accept')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.12)',
  },
  flag: {
    width: 28,
    height: 18,
    borderRadius: 3,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.24,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.85,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  accept: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  dismiss: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  pillText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CountryChangeToast;
