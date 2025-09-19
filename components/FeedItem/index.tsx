import React, { memo, useEffect, useMemo } from 'react';
import { Text, Pressable, Image, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Pin } from 'lucide-react-native';
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
import { FeedPost, LinkPreviewData } from '@/lib/api/generated';
import { t } from '@/lib/i18n';

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
    prevProps.liveEndedAt === nextProps.liveEndedAt
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
    recordingText: {
      ...styles.recordingText,
      color: theme.colors.feedItem.secondaryText,
    },
    locationText: {
      ...styles.locationText,
      color: theme.colors.primary,
    },
    titleText: {
      ...styles.titleText,
      color: theme.colors.text,
    },
  };

  return (
    <View style={themedStyles.container}>
      <Pressable
        style={themedStyles.contentWrapper}
        onPress={() => {
          router.navigate({
            pathname: '/verification/[verificationId]',
            params: { verificationId },
          });
        }}
      >
        <View style={themedStyles.avatarContainer}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              handleProfilePress();
            }}
          >
            <Avatar
              alt="Avatar"
              style={{
                width: 50,
                height: 50,
                borderRadius: 35,
                borderWidth: isLive ? 1 : 0,
                borderColor: 'transparent',
              }}
            >
              <AvatarImage
                source={{ uri: avatarUrl }}
                style={themedStyles.avatarImage}
              />
            </Avatar>
            {isLive && (
              <View style={themedStyles.liveIndicator}>
                <Text style={themedStyles.liveText}>LIVE</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={themedStyles.contentContainer}>
          <View style={themedStyles.headerContainer}>
            <View style={themedStyles.headerLeft}>
              <View style={themedStyles.nameContainer}>
                <Text style={[themedStyles.nameText]}>{name}</Text>
                <Text style={themedStyles.timeText}>· {formattedTime}</Text>
                {hasRecording && (
                  <Text style={themedStyles.recordingText}>
                    · {t('common.was_live')}
                  </Text>
                )}
              </View>
            </View>
            {!isWeb && (
              <MenuView
                verificationId={verificationId}
                posterId={posterId}
                isPublic={isPublic}
                feedId={feedId}
              />
            )}
          </View>
          {titleToUse && realTimeImageUrl && (
            <Pressable
              onPress={() => {
                if (!verificationId) return;
                const wasLightboxActive = closeLightbox();

                // If lightbox was active, wait for animation to complete before navigating
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
              hasAISummary={
                verification?.ai_video_summary_status === 'COMPLETED'
              }
              verificationId={verificationId}
              inFeedView={true}
              factuality={verification?.fact_check_data?.factuality}
            />
          )}
          <FeedActions
            // isOwner={user?.id === posterId}
            showFactualityBadge={isJustText}
            // hideUserRects={isPreviewFeedItem || false}
            verificationId={verificationId}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // backgroundColor: "#000",
    paddingTop: 16,
    paddingBottom: 0,
    paddingHorizontal: 8,
  },
  contentWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 3,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  nameText: {
    fontWeight: '600',
    fontSize: 15,
    // color: "#E7E9EA",
  },
  pinnedContainer: {
    marginRight: 6,
  },
  timeText: {
    fontWeight: '400',
    fontSize: 15,
    // color: "#71767B",
    marginLeft: 4,
  },
  recordingText: {
    fontWeight: '400',
    fontSize: 15,
    // color: "#71767B",
    marginLeft: 4,
  },
  locationText: {
    fontWeight: '500',
    fontSize: 13,
    // color: "#1D9BF0",
    marginTop: 2,
  },
  affiliatedIcon: {
    width: 16,
    height: 16,
    marginLeft: 2,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
    paddingRight: 20,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
});

export default memo(FeedItem, arePropsEqual);
