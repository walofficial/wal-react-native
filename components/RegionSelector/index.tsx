import React, { useRef } from 'react';
import { Pressable, StyleSheet, Platform, Alert, View } from 'react-native';
import {
  MenuView as RNMenuView,
  MenuComponentRef,
} from '@react-native-menu/menu';
import { Ionicons } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import {
  getRegionFromNewsFeedId,
  Region,
  REGION_FEED_IDS,
  REGION_TO_COUNTRY_CODE,
} from '@/atoms/localization';
import { t } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import AnimatedPressable from '@/components/AnimatedPressable';
import { updateUserMutation } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '../AuthLayer';
import { Image } from 'expo-image';
import { getFlagUrl } from '@/lib/countries';

interface RegionSelectorProps {
  onRegionChange?: (region: Region) => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ onRegionChange }) => {
  const menuRef = useRef<MenuComponentRef>(null);
  const { user, setAuthUser } = useSession();
  const preferredRegion = getRegionFromNewsFeedId(
    user?.preferred_news_feed_id || '',
  );
  const theme = useTheme();
  const updateUserMutationHook = useMutation({
    ...updateUserMutation(),
    onMutate: (variables) => {
      setAuthUser({
        ...user,
        preferred_news_feed_id: variables.body.preferred_news_feed_id,
        preferred_fact_check_feed_id:
          variables.body.preferred_fact_check_feed_id,
      });
    },
    onSuccess: () => {},
    onError: (error) => {
      Alert.alert(t('common.profile_update_failed'));
    },
  });
  const handleRegionSelect = (region: Region) => {
    onRegionChange?.(region);
    updateUserMutationHook.mutate({
      body: {
        preferred_news_feed_id: REGION_FEED_IDS[region].news,
        preferred_fact_check_feed_id: REGION_FEED_IDS[region].factCheck,
      },
    });
  };

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
    <RNMenuView
      ref={menuRef}
      title={t('settings.preferred_country')}
      onPressAction={({ nativeEvent }) => {
        const selectedRegion = nativeEvent.event as Region;
        if (
          selectedRegion &&
          ['georgia', 'united_states', 'france'].includes(selectedRegion)
        ) {
          handleRegionSelect(selectedRegion);
        }
      }}
      shouldOpenOnLongPress={false}
      actions={
        [
          // {
          //   id: 'georgia',
          //   title: `🇬🇪 ${getRegionDisplayName('georgia')}`,
          //   state: preferredRegion === 'georgia' ? 'on' : 'off',
          // },
          // {
          //   id: "united_states",
          //   title: `🇺🇸 ${getRegionDisplayName("united_states")}`,
          //   state: preferredRegion === "united_states" ? "on" : "off",
          // },
          // {
          //   id: "france",
          //   title: `🇫🇷 ${getRegionDisplayName("france")}`,
          //   state: preferredRegion === "france" ? "on" : "off",
          // },
        ]
      }
    >
      <AnimatedPressable
        onClick={() => {
          // if (Platform.OS === 'android') {
          //   menuRef.current?.show();
          // }
        }}
        disabled
      >
        <Ionicons size={28} name="globe-outline" color={theme.colors.icon} />
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {t('settings.preferred_country')}
        </Text>
        <View style={styles.flagContainer}>
          <Image
            source={{ uri: getCurrentRegionFlag() }}
            style={styles.flag}
            contentFit="cover"
            transition={200}
          />
          <Text style={[styles.selectedText, { color: theme.colors.text }]}>
            {getCurrentRegionName()}
          </Text>
        </View>
      </AnimatedPressable>
    </RNMenuView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    marginLeft: 16,
    fontWeight: '600',
  },
  selectedText: {
    marginLeft: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  flag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 8,
  },
});

export default RegionSelector;
