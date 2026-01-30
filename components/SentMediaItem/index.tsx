import React, { useRef, useCallback } from 'react';
import MessageItemLayout from '../Chat/message-item-layout';
import {
  Text,
  StyleSheet,
  View,
  useColorScheme,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { FontSizes } from '@/lib/theme';
import { formatDistanceToNow } from 'date-fns';
import Animated, { FadeIn } from 'react-native-reanimated';
import { t } from '@/lib/i18n';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../ToastUsage';
import { ChatMessageAttachment } from '@/lib/api/generated/types.gen';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { convertToCDNUrl } from '@/lib/utils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65; // Max 65% of screen width
const MAX_IMAGE_HEIGHT = 300;

interface MessageItemProps {
  id: string;
  content: React.ReactNode;
  isAuthor: boolean;
  createdAt?: Date;
  isLastFromAuthor?: boolean;
  attachments?: ChatMessageAttachment[] | null;
}

// We can now properly animate the MessageItemLayout since it has forwardRef
const AnimatedMessageLayout =
  Animated.createAnimatedComponent(MessageItemLayout);

const SentMediaItem: React.FC<MessageItemProps> = React.memo(
  ({ id, content, isAuthor, createdAt, isLastFromAuthor, attachments }) => {
    const colorScheme = useColorScheme();
    const { success } = useToast();
    const { openLightbox } = useLightboxControls();
    const isDark = colorScheme === 'dark';

    // Store loaded image dimensions for accurate lightbox positioning
    const loadedDimensionsRef = useRef<
      Map<string, { width: number; height: number }>
    >(new Map());

    const formattedTime = createdAt
      ? formatDistanceToNow(new Date(createdAt), { addSuffix: false })
          .replace('less than a minute', t('common.now'))
          .replace('about ', '')
          .replace('minute', t('common.minute_short'))
          .replace('minutes', t('common.minute_short'))
          .replace('hour', t('common.hour_short'))
          .replace('hours', t('common.hour_short'))
          .replace('day', t('common.day_short'))
          .replace('days', t('common.day_short'))
          .replace('month', t('common.month_short'))
          .replace('months', t('common.month_short'))
          .replace('year', t('common.year_short'))
          .replace('years', t('common.year_short'))
      : '';

    const handleLongPress = React.useCallback(async () => {
      if (typeof content !== 'string' || !content) return;
      try {
        await Clipboard.setStringAsync(content);
        success({ title: t('common.copied_to_clipboard') });
      } catch (error) {
        // noop
      }
    }, [content]);

    const showTime = isAuthor && isLastFromAuthor && createdAt;
    const hasAttachments = attachments && attachments.length > 0;
    const hasTextContent =
      typeof content === 'string' && content.trim().length > 0;
    const isImageOnly = hasAttachments && !hasTextContent;

    // Calculate image dimensions preserving aspect ratio
    const getImageDimensions = (attachment: ChatMessageAttachment) => {
      const width = attachment.width || 300;
      const height = attachment.height || 300;
      const aspectRatio = width / height;

      let displayWidth = Math.min(MAX_IMAGE_WIDTH, width);
      let displayHeight = displayWidth / aspectRatio;

      // If height exceeds max, scale down based on height
      if (displayHeight > MAX_IMAGE_HEIGHT) {
        displayHeight = MAX_IMAGE_HEIGHT;
        displayWidth = displayHeight * aspectRatio;
      }

      return { width: displayWidth, height: displayHeight };
    };

    const handleImageLoad = useCallback(
      (url: string, width: number, height: number) => {
        loadedDimensionsRef.current.set(url, { width, height });
      },
      [],
    );

    const handleImagePress = (
      attachment: ChatMessageAttachment,
      index: number,
    ) => {
      if (!attachments) return;

      const images = attachments
        .filter((a) => a.type === 'image')
        .map((a) => {
          const url = convertToCDNUrl(a.url);
          // Use loaded dimensions if available, otherwise fall back to attachment dimensions
          const loadedDims = loadedDimensionsRef.current.get(url);
          const dims =
            loadedDims ||
            (a.width && a.height ? { width: a.width, height: a.height } : null);

          return {
            uri: url,
            thumbUri: url,
            alt: 'Chat image',
            dimensions: dims,
            thumbDimensions: dims,
            type: 'image' as const,
          };
        });

      openLightbox({
        images,
        index,
      });
    };

    const renderAttachments = () => {
      if (!hasAttachments) return null;

      return (
        <View
          style={[
            styles.attachmentsContainer,
            !isImageOnly && styles.attachmentsWithText,
          ]}
        >
          {attachments!.map((attachment, index) => {
            if (attachment.type === 'image') {
              const dims = getImageDimensions(attachment);
              const imageUrl = convertToCDNUrl(attachment.url);
              return (
                <TouchableOpacity
                  key={`${id}-attachment-${index}`}
                  onPress={() => handleImagePress(attachment, index)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={[
                      styles.attachmentImage,
                      {
                        width: dims.width,
                        height: dims.height,
                      },
                    ]}
                    contentFit="cover"
                    transition={200}
                    onLoad={(e) => {
                      handleImageLoad(
                        imageUrl,
                        e.source.width,
                        e.source.height,
                      );
                    }}
                  />
                </TouchableOpacity>
              );
            }
            return null;
          })}
          {showTime && isImageOnly && (
            <Text style={styles.timeTextOnImage}>{formattedTime}</Text>
          )}
        </View>
      );
    };

    // For image-only messages, render without the message layout wrapper
    if (isImageOnly) {
      return (
        <Animated.View
          style={[
            styles.imageOnlyWrapper,
            isAuthor ? styles.authorContainer : styles.nonAuthorContainer,
          ]}
          entering={
            isAuthor ? FadeIn.duration(150) : FadeIn.duration(200).delay(50)
          }
        >
          {renderAttachments()}
        </Animated.View>
      );
    }

    return (
      <AnimatedMessageLayout
        isAuthor={isAuthor}
        entering={
          isAuthor ? FadeIn.duration(150) : FadeIn.duration(200).delay(50)
        }
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={250}
          style={styles.contentContainer}
        >
          {renderAttachments()}
          {hasTextContent && (
            <View style={styles.messageWrapper}>
              <Text
                style={[
                  styles.contentText,
                  isAuthor
                    ? styles.authorContentText
                    : isDark
                    ? styles.nonAuthorContentTextDark
                    : styles.nonAuthorContentTextLight,
                ]}
              >
                {content}
                {showTime && (
                  <Text style={styles.timeSpacer}>{`  ${formattedTime}`}</Text>
                )}
              </Text>
            </View>
          )}
          {showTime && <Text style={styles.timeText}>{formattedTime}</Text>}
        </Pressable>
      </AnimatedMessageLayout>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.id === nextProps.id &&
      prevProps.isLastFromAuthor === nextProps.isLastFromAuthor &&
      prevProps.attachments === nextProps.attachments
    );
  },
);

const styles = StyleSheet.create({
  imageOnlyWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: '80%',
  },
  authorContainer: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  nonAuthorContainer: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  contentContainer: {
    position: 'relative',
  },
  messageWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contentText: {
    fontSize: FontSizes.medium,
  },
  authorContentText: {
    color: 'white',
  },
  nonAuthorContentTextDark: {
    color: 'white',
  },
  nonAuthorContentTextLight: {
    color: '#000000', // Black text for light mode non-author messages (Messenger/Signal style)
  },
  // Invisible spacer to reserve space for timestamp
  timeSpacer: {
    fontSize: FontSizes.small,
    color: 'transparent',
  },
  // Actual timestamp positioned at bottom right
  timeText: {
    fontSize: FontSizes.small,
    color: 'rgba(255, 255, 255, 0.7)',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  timeTextOnImage: {
    fontSize: FontSizes.small,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    position: 'absolute',
    bottom: 8,
    right: 8,
    overflow: 'hidden',
  },
  attachmentsContainer: {
    gap: 4,
    position: 'relative',
  },
  attachmentsWithText: {
    marginBottom: 4,
  },
  attachmentImage: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default SentMediaItem;
