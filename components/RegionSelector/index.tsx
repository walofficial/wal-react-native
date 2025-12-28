import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  getRegionFromNewsFeedId,
  Region,
  REGION_TO_COUNTRY_CODE,
} from '@/atoms/localization';
import { t } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { useSession } from '../AuthLayer';
import { Image } from 'expo-image';
import { getFlagUrl } from '@/lib/countries';

const RegionSelector: React.FC = () => {
  const { user } = useSession();
  const preferredRegion = getRegionFromNewsFeedId(
    user?.preferred_news_feed_id || '',
  );
  const theme = useTheme();

  const getRegionDisplayName = (region: Region): string => {
    return t(`regions.${region}`);
  };

  const getCurrentRegionName = (): string => {
    return getRegionDisplayName(preferredRegion as Region);
  };

  const getCurrentRegionFlag = (): string => {
    const countryCode = REGION_TO_COUNTRY_CODE[preferredRegion as Region];
    return getFlagUrl(countryCode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.regionDisplay}>
        <Image
          source={{ uri: getCurrentRegionFlag() }}
          style={styles.flag}
          contentFit="cover"
          transition={200}
        />
        <Text style={[styles.regionName, { color: theme.colors.text }]}>
          {getCurrentRegionName()}
        </Text>
      </View>
      <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
        {t('settings.region_based_on_location')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  regionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  regionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.7,
  },
});

export default RegionSelector;
