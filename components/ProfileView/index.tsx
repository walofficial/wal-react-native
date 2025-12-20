import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextLayoutEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { useProfileInformation } from '@/hooks/useProfileInformation';
import { convertToCDNUrl } from '@/lib/utils';
import UserCircleProfile from '../UserCircleProfile';
import { spacing } from '@/utils/styleUtils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/theme';
import useAuth from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import BottomSheet from '@gorhom/bottom-sheet';
import CompanySelectorSheet from '@/components/UserPreferences/CompanySelectorSheet';
import BioEditorSheet from '@/components/UserPreferences/BioEditorSheet';
import ProfilePhotoEditSheet from '@/components/UserPreferences/ProfilePhotoEditSheet';

const BIO_MAX_LINES = 2;

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const { data: profile, isFetching } = useProfileInformation(userId);
  const theme = useTheme();
  const { user } = useAuth();
  const isAuthUser = user?.id === userId;
  const isLoadingData = isFetching;

  const photoSheetRef = useRef<BottomSheet>(null);
  const companySheetRef = useRef<BottomSheet>(null);
  const bioSheetRef = useRef<BottomSheet>(null);

  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [bioNeedsTruncation, setBioNeedsTruncation] = useState(false);

  const shouldShowMeta = useMemo(() => {
    if (isLoadingData) return false;
    return Boolean(isAuthUser || profile?.company || profile?.bio);
  }, [isAuthUser, isLoadingData, profile?.bio, profile?.company]);
  const isCompanyPressable = isAuthUser;
  const shouldShowAddBio = Boolean(
    isAuthUser && !isLoadingData && !profile?.bio,
  );

  const handleBioTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lineCount = e.nativeEvent.lines.length;
      setBioNeedsTruncation(lineCount > BIO_MAX_LINES);
    },
    [],
  );

  const handleBioPress = useCallback(() => {
    if (isAuthUser) {
      bioSheetRef.current?.snapToIndex(0);
    } else if (bioNeedsTruncation) {
      setIsBioExpanded((prev) => !prev);
    }
  }, [isAuthUser, bioNeedsTruncation]);

  return (
    <>
      <UserCircleProfile
        photo={convertToCDNUrl(profile?.photos[0].image_url[0] || '')}
        userId={userId}
        onPressAuthUser={() => photoSheetRef.current?.snapToIndex(0)}
      />
      {shouldShowMeta && (
        <View style={styles.metaContainer}>
          <TouchableOpacity
            activeOpacity={isCompanyPressable ? 0.7 : 1}
            disabled={!isCompanyPressable}
            onPress={() => companySheetRef.current?.snapToIndex(0)}
            style={[
              styles.companyRow,
              isCompanyPressable && {
                opacity: 0.85,
              },
            ]}
          >
            {profile?.company ? (
              <>
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
              </>
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.companyText,
                  { color: theme.colors.feedItem.secondaryText },
                ]}
              >
                {isAuthUser ? t('profile.set_company') : ''}
              </Text>
            )}
          </TouchableOpacity>

          {profile?.bio ? (
            <Pressable
              onPress={handleBioPress}
              style={({ pressed }) => [
                styles.bioRow,
                pressed &&
                  (isAuthUser || bioNeedsTruncation) &&
                  styles.bioPressed,
              ]}
            >
              <Text
                style={[styles.bioText, { color: theme.colors.text }]}
                numberOfLines={isBioExpanded ? undefined : BIO_MAX_LINES}
                onTextLayout={handleBioTextLayout}
              >
                {profile.bio}
              </Text>
              {!isBioExpanded && bioNeedsTruncation && !isAuthUser && (
                <Text
                  style={[
                    styles.viewMoreText,
                    { color: theme.colors.feedItem.secondaryText },
                  ]}
                >
                  {t('common.more')}
                </Text>
              )}
            </Pressable>
          ) : shouldShowAddBio ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => bioSheetRef.current?.snapToIndex(0)}
              style={[
                styles.addBioButton,
                {
                  backgroundColor: theme.colors.feedItem.background,
                  borderColor: theme.colors.feedItem.border,
                },
              ]}
            >
              <View
                style={[
                  styles.addBioIconContainer,
                  { backgroundColor: theme.colors.card.background },
                ]}
              >
                <Ionicons name="pencil" size={14} color={theme.colors.icon} />
              </View>
              <View style={styles.addBioTextContainer}>
                <Text
                  style={[styles.addBioTitle, { color: theme.colors.text }]}
                >
                  {t('profile.about_me')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.feedItem.secondaryText}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {isAuthUser ? (
        <>
          <ProfilePhotoEditSheet bottomSheetRef={photoSheetRef} />
          <CompanySelectorSheet
            bottomSheetRef={companySheetRef}
            userId={userId}
          />
          <BioEditorSheet
            bottomSheetRef={bioSheetRef}
            userId={userId}
            initialBio={profile?.bio}
          />
        </>
      ) : null}
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
    maxWidth: '90%',
  },
  bioRow: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '92%',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bioPressed: {
    opacity: 0.6,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: '100%',
  },
  viewMoreText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  addBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '92%',
  },
  addBioIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBioTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  addBioTitle: {
    fontSize: 14,
    fontWeight: '600',
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
