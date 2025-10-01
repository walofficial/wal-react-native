import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams,
  usePathname,
  useGlobalSearchParams,
} from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LinkPreviewData,
  LocationFeedPost,
  publishPost,
} from '@/lib/api/generated';
import { useToast } from '@/lib/context/ToastContext';
import PostControls from '@/components/PostControls';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { isAndroid, isIOS } from '@/lib/platform';
import { compressIfNeeded } from '@/lib/media/manip';
import CreatePostHeader from '@/components/CreatePost/CreatePostHeader';
import ImagePickerGrid from '@/components/CreatePost/ImagePickerGrid';
import { useImagePicker } from '@/components/CreatePost/useImagePicker';
import { FontSizes, useTheme } from '@/lib/theme';
import useAuth from '@/hooks/useAuth';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import LinkPreview from '@/components/LinkPreview';
import SourceInfoCard from '@/components/CreatePost/SourceInfoCard';
import { useColorScheme } from 'react-native';
import { useMinimalShellMode } from '@/lib/context/header-transform';
import * as Clipboard from 'expo-clipboard';
import {
  getLocationFeedPaginatedInfiniteOptions,
  getLocationFeedPaginatedInfiniteQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { formDataBodySerializer } from '@/lib/utils/form-data';
import { t } from '@/lib/i18n';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';

const MAX_CHARS = 1500;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  textInput: {
    textAlign: 'left',
    fontSize: FontSizes.medium,
    lineHeight: 24,
    textAlignVertical: 'top',
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  noticeContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    padding: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 16,
    marginLeft: 8,
    padding: 12,
  },
  summaryNoticeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryNoticeText: {
    color: 'white',
    fontSize: FontSizes.small,
    fontWeight: '500',
  },
});

export default function CreatePost() {
  const { feedId, content_type } = useGlobalSearchParams<{
    feedId: string;
    content_type: 'last24h' | 'youtube_only' | 'social_media_only';
  }>();
  const {
    disableImagePicker,
    disableRoomCreation,
    sharedContent,
    sharedImages,
  } = useLocalSearchParams<{
    disableImagePicker?: string;
    disableRoomCreation?: string;
    sharedContent?: string;
    sharedImages?: string;
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [text, setText] = useState(sharedContent || '');
  useEffect(() => {
    if (sharedContent) {
      setText(sharedContent);
    }
  }, [sharedContent]);
  const [isInvalidLink, setIsInvalidLink] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();
  const { success, error: errorToast } = useToast();

  const queryClient = useQueryClient();
  const {
    selectedImages,
    handleImagePick,
    handlePasteImage,
    handleCopyImage,
    removeImage,
    setSelectedImages,
  } = useImagePicker();

  // Handle shared images from share intent
  useEffect(() => {
    if (sharedImages) {
      try {
        const decodedImages = JSON.parse(decodeURIComponent(sharedImages));
        if (Array.isArray(decodedImages) && decodedImages.length > 0) {
          // Validate that the decoded images have the correct structure
          const validImages = decodedImages.filter(
            (img) =>
              img.uri &&
              typeof img.width === 'number' &&
              typeof img.height === 'number',
          );

          if (validImages.length > 0) {
            setSelectedImages(validImages);
          }
        }
      } catch (error) {
        console.error('Error parsing shared images:', error);
        errorToast({ title: 'Failed to load shared images' });
      }
    }
  }, [sharedImages, setSelectedImages]);

  const { previewData, isLoading: isPreviewLoading } = useLinkPreview(text);

  const router = useRouter();
  const isShareIntent = sharedContent || sharedImages;
  const { headerMode } = useMinimalShellMode();

  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet';
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      );
    },
    [headerMode],
  );

  // Effect to scroll to the image gallery when images are added
  useEffect(() => {
    if (selectedImages.length > 0) {
      // Add a small delay to ensure the layout has updated
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [selectedImages.length]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const trimmedText = text.trim();
      if (!trimmedText && selectedImages.length === 0) {
        throw new Error('Post cannot be empty');
      }

      const files = [];

      // Compress and append images
      for (const image of selectedImages) {
        // Extract the actual file path without file:// prefix for compressIfNeeded
        let imagePath = image.uri;
        if (imagePath.startsWith('file://')) {
          imagePath = imagePath.replace('file://', '');
        }

        const compressedImage = await compressIfNeeded(
          {
            path: imagePath,
            width: image.width,
            height: image.height,
            size: image.fileSize || 0,
          },
          1000000, // 1MB max size
        );

        // Ensure proper file:// prefix for FormData
        const finalUri = compressedImage.path.startsWith('file://')
          ? compressedImage.path
          : 'file://' + compressedImage.path;

        files.push({
          uri: finalUri,
          type: 'image/jpeg',
          name: compressedImage.path.split('/').pop(),
        });
      }

      return publishPost({
        ...formDataBodySerializer,
        body: {
          feed_id: feedId,
          content: trimmedText,
          files: files as any,
        },
        throwOnError: true,
      });
    },
    onSuccess: (publishedDoc) => {
      // Initialize cacheUpdateContentType with the content_type from local search params
      // content_type is guaranteed to be one of "last24h" | "youtube_only" | "social_media_only" by its type definition
      let navigationTargetContentType:
        | 'last24h'
        | 'youtube_only'
        | 'social_media_only' = content_type;
      if (!navigationTargetContentType) {
        if (previewData?.url) {
          if (
            previewData.url.includes('youtube.com') ||
            previewData.url.includes('youtu.be')
          ) {
            navigationTargetContentType = 'youtube_only';
          } else if (
            previewData.url.includes('facebook.com') ||
            previewData.url.includes('fb.com')
          ) {
            navigationTargetContentType = 'social_media_only';
          } else {
            navigationTargetContentType = 'last24h';
          }
        }
      }
      const queryOptions = getLocationFeedPaginatedInfiniteOptions({
        query: {
          page_size: LOCATION_FEED_PAGE_SIZE,
          content_type_filter: navigationTargetContentType,
        },
        path: {
          feed_id: feedId,
        },
      });

      queryClient.setQueryData(queryOptions.queryKey, (data) => {
        if (!data) {
          return {
            pages: [],
            pageParams: [],
          };
        }
        return {
          ...data,
          pages: data.pages.map((page, index) => {
            return index === 0
              ? {
                  ...page,
                  data: [
                    {
                      ...publishedDoc,
                      assignee_user: user,
                    },
                    ...page,
                  ],
                }
              : page;
          }),
        };
      });

      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
        exact: false,
      });

      if (navigationTargetContentType && !isShareIntent) {
        router.back();
        router.replace({
          pathname: `/(tabs)/(fact-check)`,
          params: {
            content_type: navigationTargetContentType,
          },
        });
      } else if (isShareIntent) {
        router.navigate({
          pathname: `/(tabs)/(fact-check)`,
          params: {
            content_type: navigationTargetContentType, // Default for share intent if no specific link
          },
        });
      } else {
        router.back();
      }

      if (isShareIntent) {
        // For share intents, ensure all relevant feeds are refreshed
        // as the user might navigate between them.
        // The cacheUpdateContentType is already invalidated above.
        if (navigationTargetContentType !== 'social_media_only') {
          queryClient.invalidateQueries({
            queryKey: getLocationFeedPaginatedInfiniteQueryKey({
              path: { feed_id: feedId },
              query: {
                page_size: LOCATION_FEED_PAGE_SIZE,
                content_type_filter: 'social_media_only',
              },
            }),
          });
        }
        if (navigationTargetContentType !== 'youtube_only') {
          queryClient.invalidateQueries({
            queryKey: getLocationFeedPaginatedInfiniteQueryKey({
              path: { feed_id: feedId },
              query: {
                page_size: LOCATION_FEED_PAGE_SIZE,
                content_type_filter: 'youtube_only',
              },
            }),
          });
        }
        // Always invalidate last24h for share intents if it wasn't the primary updated one
        if (navigationTargetContentType !== 'last24h') {
          queryClient.invalidateQueries({
            queryKey: getLocationFeedPaginatedInfiniteQueryKey({
              path: { feed_id: feedId },
              query: {
                page_size: LOCATION_FEED_PAGE_SIZE,
                content_type_filter: 'last24h',
              },
            }),
          });
        }
      }
      setMode(false);
    },
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
      errorToast({
        title: t('errors.post_publish_failed'),
        description:
          error instanceof Error
            ? error.message
            : t('errors.post_publish_failed'),
      });
    },
  });

  const insets = useSafeAreaInsets();
  const charactersLeft = MAX_CHARS - text.length;

  const handlePublish = () => {
    if (text.trim().length === 0 && selectedImages.length === 0) {
      errorToast({
        title: t('errors.post_empty'),
        description: t('errors.post_empty'),
      });
      return;
    }
    mutate();
  };

  const opacity = useSharedValue(0);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    if (previewData) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0);
    }
  }, [previewData]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(previewData || isPreviewLoading ? 1 : 0, {
      duration: 300,
    }),
    transform: [
      {
        translateY: withTiming(previewData || isPreviewLoading ? 0 : 10, {
          duration: 300,
        }),
      },
    ],
  }));

  const textInputRef = useRef<TextInput>(null);

  // Handle paste event for web
  const handlePaste = async (e: any) => {
    if (Platform.OS === 'web') {
      // Check if clipboard has image
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        e.preventDefault();
        await handlePasteImage();
        return;
      }
      // Otherwise, allow default paste (text)
    }
  };

  // Handle focus/long-press for native
  const handleNativePasteCheck = async () => {
    if (Platform.OS !== 'web') {
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        // Optionally, prompt user before pasting
        await handlePasteImage();
      }
    }
  };

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={isAndroid ? insets.top : insets.bottom + 10}
        style={[
          styles.container,
          {
            paddingTop: isAndroid ? insets.top : 20,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <CreatePostHeader
          onPublish={handlePublish}
          isDisabled={
            (text.trim().length === 0 && selectedImages.length === 0) ||
            isInvalidLink
          }
          isPending={isPending}
          isFactCheckEnabled={false}
          isShareIntent={!!isShareIntent}
        />

        <ScrollView
          style={styles.scrollView}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder={t('common.recheck_description')}
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            multiline
            maxLength={MAX_CHARS}
            value={text}
            onChangeText={setText}
            autoFocus
            textAlignVertical="top"
            scrollEnabled={true}
            returnKeyType="default"
            enablesReturnKeyAutomatically
            blurOnSubmit={false}
            // Web: handle paste event
            {...(Platform.OS === 'web'
              ? { onPaste: handlePaste }
              : {
                  // Native: check clipboard for image on focus/long-press
                  onFocus: handleNativePasteCheck,
                  onLongPress: handleNativePasteCheck,
                })}
          />

          {(previewData || isPreviewLoading) && (
            <Animated.View style={animatedStyle}>
              <LinkPreview
                previewData={previewData as LinkPreviewData}
                isLoading={isPreviewLoading}
                onInvalidLinkChange={setIsInvalidLink}
              />
            </Animated.View>
          )}
          <ImagePickerGrid
            selectedImages={selectedImages}
            onRemoveImage={removeImage}
            onCopyImage={handleCopyImage}
          />
        </ScrollView>

        {/* {disableRoomCreation === "true" && isNoticeVisible && (
          <Animated.View style={[styles.noticeContainer, noticeAnimatedStyle]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsNoticeVisible(false)}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.noticeContent}>
              <Ionicons name="information-circle" size={20} color={theme.colors.text} />
              <Text style={[styles.noticeText, { color: theme.colors.text }]}>
                თქვენ შეგიძლიათ მიუთითოთ ფოსტის ლინკები სხვა სოც ქსელებიდან ან
                ფოტოები გადამოწმებისთვის
              </Text>
            </View>
          </Animated.View>
        )} */}

        <SourceInfoCard
          hide={!!text || !!previewData || selectedImages.length > 0}
        />

        <PostControls
          feedId={feedId}
          charactersLeft={charactersLeft}
          onImagePress={handleImagePick}
          disableImagePicker={disableImagePicker === 'true'}
          disableRoomCreation={disableRoomCreation === 'true'}
          showFactCheck={false}
          isFactCheckEnabled={false}
          onFactCheckToggle={() => {}}
          selectedImagesCount={selectedImages.length}
          maxImages={3}
        />
      </KeyboardAvoidingView>
    </>
  );
}
