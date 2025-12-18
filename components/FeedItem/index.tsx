import React, { memo, useMemo } from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Globe, Lock } from 'lucide-react-native';
import MediaContent from './MediaContent';
import FeedActions from './FeedActions';
import { isWeb } from '@/lib/platform';
import MenuView from './MenuView';
import { formatRelativeTime } from '@/lib/utils/date';
import ExpandableText from './ExpandableText';
import { useTheme } from '@/lib/theme';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import LinkPreview from '../LinkPreview';
import useVerificationById from '@/hooks/useVerificationById';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import useAuth from '@/hooks/useAuth';
import { FeedPost } from '@/lib/api/generated';
import { t } from '@/lib/i18n';
import { convertToCDNUrl } from '@/lib/utils';

// Comparison function for memo - now includes all props since we simplified the interface
function arePropsEqual(prevProps: any, nextProps: any) {
  return (
    prevProps.posterId === nextProps.posterId &&
    prevProps.time === nextProps.time &&
    prevProps.name === nextProps.name &&
    prevProps.isLive === nextProps.isLive &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.hasRecording === nextProps.hasRecording &&
    prevProps.verificationId === nextProps.verificationId &&
    prevProps.feedId === nextProps.feedId &&
    prevProps.isPublic === nextProps.isPublic &&
    prevProps.text === nextProps.text &&
    prevProps.isSpace === nextProps.isSpace &&
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.livekitRoomName === nextProps.livekitRoomName &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.title === nextProps.title &&
    prevProps.imageGalleryWithDims === nextProps.imageGalleryWithDims &&
    prevProps.ai_video_summary_status === nextProps.ai_video_summary_status &&
    prevProps.fact_check_status === nextProps.fact_check_status &&
    prevProps.fact_check_data === nextProps.fact_check_data &&
    prevProps.thumbnail === nextProps.thumbnail &&
    prevProps.liveEndedAt === nextProps.liveEndedAt &&
    prevProps.isLocationLocked === nextProps.isLocationLocked
  );
}

function FeedItem({
  name,
  time,
  posterId,
  isLive,
  avatarUrl,
  previewData,
  hasRecording,
  verificationId,
  feedId,
  isPublic,
  text,
  isSpace,
  videoUrl,
  externalVideo,
  livekitRoomName,
  isVisible,
  title,
  imageGalleryWithDims,
  thumbnail,
  fact_check_data,
  liveEndedAt,
  isLocationLocked,
}: {
  name: string;
  time: string;
  posterId: string;
  isLive: FeedPost['is_live'];
  avatarUrl: string;
  hasRecording: FeedPost['has_recording'];
  verificationId: FeedPost['id'];
  feedId: FeedPost['feed_id'];
  isPublic: FeedPost['is_public'];
  text: FeedPost['text_content'];
  isSpace: FeedPost['is_space'];
  videoUrl: string;
  externalVideo: FeedPost['external_video'];
  livekitRoomName: FeedPost['livekit_room_name'];
  isVisible: boolean;
  title: FeedPost['title'];
  imageGalleryWithDims: FeedPost['image_gallery_with_dims'];
  fact_check_data: FeedPost['fact_check_data'];
  previewData: FeedPost['preview_data'];
  thumbnail: string;
  liveEndedAt: FeedPost['live_ended_at'];
  isLocationLocked?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const formattedTime = formatRelativeTime(time);
  const { closeLightbox } = useLightboxControls();

  // This can be used for real time information as this is actually polling the data from the server
  const { data: verification } = useVerificationById(verificationId, !!isLive, {
    refetchInterval: 5000,
  });

  const handleProfilePress = () => {
    if (user?.id === posterId) {
      return;
    }
    router.navigate({
      pathname: `/profile`,
      params: {
        userId: posterId,
      },
    });
  };

  // This is a link link generated without calling an APIs using link-preview-js.
  // It is used as a fallback for the link preview from our services.
  const localLinkPreview = useLinkPreview(text || '', false);
  // We check if the current fetched item has a preview, if doesn't we fallback to real time source, it might get populated later.
  // If not fallback to the local link preview.
  // ORDER OF SOURCES IS IMPORTANT HERE.
  // 1. Paginated data
  // 2. Real time data
  // 3. Local link preview

  const previewDataToUse =
    verification?.preview_data || previewData || localLinkPreview.previewData;

  const hasPreview = !!previewDataToUse;

  // IMAGE GALLERY IS DEPRECATED we should use image_gallery_with_dims instead.
  const realTimeImageUrl =
    verification?.image_gallery_with_dims?.[0]?.url ||
    imageGalleryWithDims?.[0]?.url;

  const isJustText = !videoUrl && !realTimeImageUrl && !externalVideo;
  // We fallback to the
  const titleToUse = verification?.title || title;
  const MemoizedMediaContent = useMemo(() => {
    // Sometimes image gallery might be populated after the scraping of the post finishes. But item is already rendered.
    return (
      <MediaContent
        videoUrl={videoUrl}
        isLive={verification?.is_live}
        isVisible={isVisible}
        verificationId={verificationId}
        feedId={feedId}
        isLocked={!!isLocationLocked}
        imageGalleryWithDims={
          verification?.image_gallery_with_dims || imageGalleryWithDims
        }
        name={name}
        text={text || ''}
        livekitRoomName={
          verification?.livekit_room_name || livekitRoomName || ''
        }
        time={time}
        avatarUrl={avatarUrl}
        thumbnail={thumbnail}
        previewData={
          hasPreview && previewDataToUse ? previewDataToUse : undefined
        }
        hasAISummary={verification?.ai_video_summary_status === 'COMPLETED'}
        factuality={
          fact_check_data?.factuality ||
          verification?.fact_check_data?.factuality
        }
        liveEndedAt={verification?.live_ended_at || liveEndedAt || undefined}
      />
    );
  }, [
    isVisible,
    hasPreview,
    previewDataToUse,
    verification?.ai_video_summary_status,
    imageGalleryWithDims,
    verification?.image_gallery_with_dims,
    isLocationLocked,
  ]);

  // Create themed styles
  const themedStyles = {
    ...styles,
    nameText: {
      ...styles.nameText,
      color: theme.colors.text,
    },
    timeText: {
      ...styles.timeText,
      color: theme.colors.feedItem.secondaryText,
    },
    dotSeparator: {
      ...styles.dotSeparator,
      color: theme.colors.feedItem.secondaryText,
    },
    wasLiveText: {
      ...styles.wasLiveText,
      color: theme.colors.feedItem.secondaryText,
    },
    titleText: {
      ...styles.titleText,
      color: theme.colors.text,
    },
  };

  return (
    <View style={themedStyles.container}>
      {/* Facebook-style Header */}
      <View style={themedStyles.headerContainer}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            handleProfilePress();
          }}
          style={themedStyles.avatarPressable}
        >
          <Avatar alt="Avatar" style={themedStyles.avatar}>
            <AvatarImage
              source={{ uri: convertToCDNUrl(avatarUrl) }}
              style={themedStyles.avatarImage}
            />
          </Avatar>
          {isLive && (
            <View style={themedStyles.liveIndicator}>
              <Text style={themedStyles.liveText}>LIVE</Text>
            </View>
          )}
        </Pressable>

        <View style={themedStyles.headerInfo}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              handleProfilePress();
            }}
          >
            <Text style={themedStyles.nameText}>{name}</Text>
          </Pressable>
          <View style={themedStyles.metaRow}>
            <Text style={themedStyles.timeText}>{formattedTime}</Text>
            {hasRecording && (
              <>
                <Text style={themedStyles.dotSeparator}>·</Text>
                <Text style={themedStyles.wasLiveText}>
                  {t('common.was_live')}
                </Text>
              </>
            )}
          </View>
        </View>

        {!isWeb && (
          <View style={themedStyles.menuContainer}>
            <MenuView
              verificationId={verificationId}
              posterId={posterId}
              isPublic={isPublic}
              feedId={feedId}
            />
          </View>
        )}
      </View>

      {/* Content Section */}
      <Pressable
        style={themedStyles.contentWrapper}
        onPress={() => {
          router.navigate({
            pathname: '/verification/[verificationId]',
            params: { verificationId },
          });
        }}
      >
        {titleToUse && realTimeImageUrl && (
          <Pressable
            onPress={() => {
              if (!verificationId) return;
              const wasLightboxActive = closeLightbox();

              if (wasLightboxActive) {
                setTimeout(() => {
                  router.navigate({
                    pathname: '/verification/[verificationId]',
                    params: { verificationId },
                  });
                }, 300);
              } else {
                router.navigate({
                  pathname: '/verification/[verificationId]',
                  params: { verificationId },
                });
              }
            }}
            android_ripple={{
              color: theme.colors.feedItem.secondaryText + '40',
            }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={themedStyles.titleText} numberOfLines={10}>
              {titleToUse}
            </Text>
          </Pressable>
        )}
        <ExpandableText
          text={text || previewDataToUse?.description || ''}
          hideForSpace={isSpace}
          noVideoMargin={!!videoUrl}
          verificationId={verificationId}
          enableNavigation
          hasPreview={hasPreview}
        />
        {MemoizedMediaContent}

        {hasPreview && previewDataToUse && !realTimeImageUrl && (
          <LinkPreview
            previewData={previewDataToUse}
            isLoading={false}
            hasAISummary={verification?.ai_video_summary_status === 'COMPLETED'}
            verificationId={verificationId}
            inFeedView={true}
            factuality={verification?.fact_check_data?.factuality}
          />
        )}
      </Pressable>

      {/* Actions Section */}
      <FeedActions
        showFactualityBadge={isJustText}
        verificationId={verificationId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  nameText: {
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  timeText: {
    fontWeight: '400',
    fontSize: 13,
  },
  dotSeparator: {
    fontSize: 13,
    marginHorizontal: 4,
  },
  wasLiveText: {
    fontWeight: '400',
    fontSize: 13,
  },
  menuContainer: {
    paddingLeft: 8,
    paddingTop: 4,
  },
  contentWrapper: {
    width: '100%',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  liveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
  },
});

export default memo(FeedItem, arePropsEqual);
