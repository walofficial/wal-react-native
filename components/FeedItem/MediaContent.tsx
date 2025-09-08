import React from 'react';
import {
  View,
  Animated,
  ActionSheetIOS,
  Platform,
  Alert,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import SimplifiedVideoPlayback from '../SimplifiedVideoPlayback';
import { AutoSizedImage } from '../AutoSizedImage';
import ImageGrid from '../ImageGrid';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { measureHandle } from '@/lib/hooks/useHandleRef';
import { MeasuredDimensions, runOnJS, runOnUI } from 'react-native-reanimated';
import { HandleRef } from '@/lib/hooks/useHandleRef';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { Dimensions } from '@/components/Lightbox/ImageViewing/@types';
import { convertToCDNUrl } from '@/lib/utils';
import FactualityBadge from '../ui/FactualityBadge';
import { FeedPost, ImageWithDims, LinkPreviewData } from '@/lib/api/generated';
import SourceIcon from '../SourceIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getFactCheckBadgeInfo } from '@/utils/factualityUtils';
import { t } from '@/lib/i18n';
import LiveStreamViewer from '../LiveStreamViewer';

interface MediaContentProps {
  videoUrl?: string;
  imageGalleryWithDims: FeedPost['image_gallery_with_dims'];
  isLive?: boolean;
  isVisible: boolean;
  redirectUrl?: string;
  verificationId: string;
  feedId?: string;
  name: string;
  time: string;
  avatarUrl: string;
  livekitRoomName?: string;
  isSpace?: boolean;
  creatorUserId?: string;
  scheduledAt?: string;
  text?: string;
  mediaAlt?: string;
  thumbnail?: string;
  previewData?: LinkPreviewData;
  hasAISummary?: boolean;
  factuality?: number;
  liveEndedAt?: string;
}

function MediaContent({
  videoUrl,
  imageGalleryWithDims,
  isLive,
  isVisible,
  verificationId,
  feedId,
  livekitRoomName,
  isSpace,
  thumbnail,
  mediaAlt,
  previewData,
  factuality,
  liveEndedAt,
}: MediaContentProps) {
  const router = useRouter();

  const badgeInfo = getFactCheckBadgeInfo(factuality);
  const images = (imageGalleryWithDims || []).map((img: ImageWithDims) => ({
    uri: img.url,
    thumbUri: img.url,
    alt: img.url,
    verificationId: verificationId,
    aspectRatio: {
      width: img.aspectRatio.width,
      height: img.aspectRatio.height,
    },
  }));
  const handleSingleTap = () => {
    // Only navigate if there are no images and no video (i.e., text-only content)
    if (images.length === 0 && !videoUrl) {
      router.navigate({
        pathname: '/verification/[verificationId]',
        params: {
          verificationId,
          feedId,
          livekitRoomName,
        },
      });
    }
  };

  const handleLongPress = (url: string, type: 'photo' | 'video') => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common.cancel'), t('common.download')],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await downloadMedia(url, type);
          }
        },
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert(t('common.download'), t('common.want_to_download'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.download'), onPress: () => downloadMedia(url, type) },
      ]);
    }
  };

  const longPressGesture = Gesture.LongPress().onStart(() => {
    if (videoUrl) {
      runOnJS(handleLongPress)(videoUrl, 'video');
    }
    // } else if (imageUrl) {
    //   runOnJS(handleLongPress)(imageUrl, "photo");
    // }
  });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      // Only handle tap for navigation if there are no images and no video
      if (!videoUrl && images.length === 0) {
        runOnJS(handleSingleTap)();
      }
    });

  // Only apply navigation gesture if there are no images to show in lightbox
  const shouldApplyNavigationGesture = images.length === 0 && !videoUrl;
  const gestures = shouldApplyNavigationGesture
    ? Gesture.Exclusive(singleTapGesture, longPressGesture)
    : longPressGesture;

  const { openLightbox } = useLightboxControls();

  const _openLightbox = (
    index: number,
    thumbRects: (MeasuredDimensions | null)[],
    fetchedDims: (Dimensions | null)[],
  ) => {
    openLightbox({
      images: images.map((item, i) => ({
        ...item,
        thumbRect: thumbRects[i] ?? null,
        thumbDimensions: fetchedDims[i] ?? null,
        type: 'image',
        dimensions: fetchedDims[i] ?? null,
      })),
      index,
    });
  };

  const downloadMedia = async (url: string, type: 'photo' | 'video') => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permission_needed_short'),
          t('common.download_media_permission'),
        );
        return;
      }

      const filename = url.split('/').pop() || `downloaded-${type}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);

      await FileSystem.deleteAsync(uri); // Cleanup downloaded file after saving

      Alert.alert(t('common.saved'));
    } catch (error) {
      Alert.alert(t('common.error_title'), t('common.download_failed'));
      console.error('Download error:', error);
    }
  };

  const handleSourcePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error_title'), t('common.error_opening_link'));
      }
    } catch (error) {
      Alert.alert(t('common.error_title'), t('common.error_opening_link'));
      console.error('Error opening URL:', error);
    }
  };

  const handlePress = (
    index: number,
    containerRefs: HandleRef[],
    fetchedDims: (Dimensions | null)[],
  ) => {
    const handles = containerRefs.map((r) => r.current);
    runOnUI(() => {
      'worklet';
      const rects = handles.map(measureHandle);
      runOnJS(_openLightbox)(index, rects, fetchedDims);
    })();
  };

  const handlePressIn = (index: number) => {
    InteractionManager.runAfterInteractions(() => {
      Image.prefetch(images.map((img) => convertToCDNUrl(img.uri)));
    });
  };

  if (isSpace) {
    if (!livekitRoomName) {
      return null;
    }

    return null;
  }

  if (!videoUrl && !imageGalleryWithDims?.length) return null;

  const renderContent = () => (
    <GestureDetector gesture={gestures}>
      <View style={styles.mediaContainer}>{renderMediaContent()}</View>
    </GestureDetector>
  );
  // Extract media content rendering to a separate function
  const renderMediaContent = () => (
    <>
      {images?.length > 1 ? (
        <ImageGrid
          images={images.map((img) => img.uri)}
          onImagePress={handleSingleTap}
          aspectRatio={1}
          verificationId={verificationId}
        />
      ) : livekitRoomName && !liveEndedAt && isLive ? (
        <LiveStreamViewer
          liveKitRoomName={livekitRoomName}
          topControls={<View />}
        />
      ) : videoUrl ? (
        <SimplifiedVideoPlayback
          src={videoUrl}
          shouldPlay={isVisible}
          isLive={isLive}
          loop={false}
          thumbnail={convertToCDNUrl(thumbnail || '')}
        />
      ) : images[0] ? (
        <View style={styles.singleImageContainer}>
          <AutoSizedImage
            image={{
              thumb: { uri: images[0].uri },
              alt: mediaAlt || 'Verification image',
              aspectRatio: {
                width: images[0].aspectRatio.width ?? 1,
                height: images[0]?.aspectRatio.height ?? 1,
              },
            }}
            onPressIn={() => handlePressIn(0)}
            onPress={(containerRef, dims) => {
              handlePress(0, [containerRef], [dims]);
            }}
            crop="constrained"
            hideBadge={false}
          />
          <View style={styles.lightboxButton} pointerEvents="none">
            <View style={styles.lightboxButtonBackground}>
              <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
          {(badgeInfo || previewData) && (
            <>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.linkPreviewGradient}
              />
              <View style={styles.linkPreviewContent}>
                {previewData && (
                  <>
                    {previewData.url && (
                      <View style={styles.linkPreviewHeader}>
                        <TouchableOpacity
                          onPress={() =>
                            handleSourcePress(previewData.url || '')
                          }
                          style={styles.sourceIconButton}
                          activeOpacity={0.7}
                        >
                          <SourceIcon sourceUrl={previewData.url} size={20} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
                {badgeInfo && (
                  <View
                    style={styles.factualityBadgeOverlay}
                    pointerEvents="none"
                  >
                    <FactualityBadge
                      text={badgeInfo.text}
                      type={badgeInfo.type}
                      style={styles.factualityBadge}
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      ) : null}
    </>
  );

  return renderContent();
}

const styles = StyleSheet.create({
  mediaContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 100,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    borderRadius: 8,
    aspectRatio: 1.5,
  },
  singleImageContainer: {
    position: 'relative',
    width: '100%',
  },
  factualityBadgeOverlay: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  factualityBadge: {},
  linkPreviewGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    zIndex: 5,
  },
  linkPreviewContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 6,
  },
  linkPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceIconButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiSummaryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiSummaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  linkPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
  },
  linkPreviewDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 18,
  },
  lightboxButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  lightboxButtonBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MediaContent;
