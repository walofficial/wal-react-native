import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSizes, useTheme } from '@/lib/theme';
import SourceIcon from '@/components/SourceIcon';
import { t } from '@/lib/i18n';

interface SourceInfoCardProps {
  hide?: boolean;
}

const SourceInfoCard: React.FC<SourceInfoCardProps> = ({ hide = false }) => {
  const theme = useTheme();

  // If hide is true, don't render the component
  if (hide) {
    return null;
  }

  return (
    <View style={styles.infoCardContainer}>
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.card.background,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.infoCardContent}>
          <View style={styles.iconsRow}>
            <SourceIcon
              sourceUrl="youtube.com"
              size={20}
              style={styles.icon}
              noBackground
            />
            <SourceIcon
              sourceUrl="facebook.com"
              size={20}
              style={styles.icon}
              noBackground
            />
          </View>
          <Text
            style={[
              styles.infoCardDescription,
              { color: theme.colors.text, fontSize: 15 },
            ]}
          >
            {t('common.source_info_card_description')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoCardContainer: {
    marginVertical: 12,
    marginHorizontal: 4,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  icon: {
    marginRight: 12,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardDescription: {
    fontSize: FontSizes.small,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default SourceInfoCard;
