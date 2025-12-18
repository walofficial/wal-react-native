import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useProfileInformation } from '@/hooks/useProfileInformation';
import { convertToCDNUrl } from '@/lib/utils';
import UserCircleProfile from '../UserCircleProfile';
import { spacing } from '@/utils/styleUtils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/theme';

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const {
    data: profile,
    isLoading,
    isFetching,
  } = useProfileInformation(userId);
  const theme = useTheme();
  const isLoadingData = isLoading || isFetching;

  return (
    <>
      <UserCircleProfile
        photo={
          isLoadingData
            ? undefined
            : convertToCDNUrl(profile?.photos[0].image_url[0] || '')
        }
        userId={userId}
      />
      {!isLoadingData && (profile?.company || profile?.bio) && (
        <View style={styles.metaContainer}>
          {profile?.company && (
            <View style={styles.companyRow}>
              <Image
                source={{ uri: profile.company.profile_picture }}
                style={[
                  styles.companyLogo,
                  { backgroundColor: theme.colors.card.background },
                ]}
                contentFit="cover"
              />
              <Text
                numberOfLines={1}
                style={[styles.companyText, { color: theme.colors.text }]}
              >
                {profile.company.name}
              </Text>
            </View>
          )}
          {profile?.bio ? (
            <Text
              style={[
                styles.bioText,
                { color: theme.colors.feedItem.secondaryText },
              ]}
            >
              {profile.bio}
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}

function StatCard({
  title,
  value,
  iconName,
  iconColor,
  theme,
}: {
  title: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  theme: any;
}) {
  const backgroundColor =
    theme.colors.background === '#000000'
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.05)';

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.colors.feedItem.background },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <Text
        style={[
          styles.statTitle,
          { color: theme.colors.feedItem.secondaryText },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
  },
  companyLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  companyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: '92%',
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  statCard: {
    borderRadius: 12,
    padding: spacing[4],
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing[2],
  },
  iconContainer: {
    marginBottom: spacing[3],
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
