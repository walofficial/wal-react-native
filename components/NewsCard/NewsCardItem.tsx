import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '../ThemedText';
import { getFaviconUrl } from '@/utils/urlUtils';
import * as Haptics from 'expo-haptics';
// timestamp/date removed from UI
import { useTheme } from '@/lib/theme';
import { useColorScheme } from 'react-native';
import FactualityBadge, { FactualityBadgeType } from '../ui/FactualityBadge';
import { t } from '@/lib/i18n';
import { FeedPost } from '@/lib/api/generated';
import { SourceIcon } from '../SourceIcon';

const MAX_SOURCES = 5;

// Helper function to get unique favicon URLs from sources
const getUniqueSourceIcons = (sources?: FeedPost['sources']) => {
  if (!sources || sources.length === 0) return [];

  const uniqueUrls = new Map();

  sources.forEach((source: { title: string; uri: string }) => {
    if (source.uri) {
      const faviconUrl = getFaviconUrl(source.uri);
      if (!uniqueUrls.has(faviconUrl)) {
        uniqueUrls.set(faviconUrl, source);
      }
    }
  });

  return Array.from(uniqueUrls.values());
};

interface NewsCardItemProps {
  item: FeedPost;
  onPress: (verificationId: string) => void;
}

const NewsCardItem: React.FC<NewsCardItemProps> = ({ item, onPress }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme() || 'dark';
  const isDark = colorScheme === 'dark';

  // Memoize the press handler to prevent recreation on every render
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(item.id);
  }, [onPress, item.id]);

  // Memoize the fact check badge info calculation
  const badgeInfo = useMemo((): {
    text: string;
    type: 'truth' | 'misleading' | 'neutral';
  } | null => {
    const score = item.fact_check_data?.factuality;

    if (score === undefined || score === null) {
      return null;
    }

    let badgeText = '';
    let badgeType: 'truth' | 'misleading' | 'neutral' = 'neutral';

    if (score >= 0.5) {
      badgeText = `${Math.round(score * 100)}% ${t('common.truth')}`;
      badgeType = 'truth';
    } else {
      badgeText = `${Math.round((1 - score) * 100)}% ${t('common.falsehood')}`;
      badgeType = 'misleading';
    }

    return { text: badgeText, type: badgeType };
  }, [item.fact_check_data?.factuality]);

  // Memoize the shared badge type
  const sharedBadgeType: FactualityBadgeType | undefined = useMemo(() => {
    if (!badgeInfo) return undefined;

    if (badgeInfo.type === 'neutral') {
      return 'needs-context';
    } else {
      return badgeInfo.type as FactualityBadgeType; // "truth" or "misleading"
    }
  }, [badgeInfo]);

  // Memoize the unique source icons to prevent recalculation
  const uniqueSourceIcons = useMemo(() => {
    return getUniqueSourceIcons(item.sources);
  }, [item.sources]);

  // Determine image source and aspect ratio
  const firstImage = item.image_gallery_with_dims?.[0];
  const hasImage = Boolean(firstImage?.url);
  const imageUrl = firstImage?.url;
  const aspectRatio =
    firstImage?.width && firstImage?.height
      ? firstImage.width / firstImage.height
      : 16 / 9;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.pressableItem}
      accessibilityRole="button"
      accessibilityLabel={`News item: ${item.title}`}
      accessibilityHint="Double tap to read full story"
    >
      <View
        style={[
          styles.newsItem,
          {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
            ...Platform.select({
              ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
              },
              android: {},
            }),
          },
        ]}
      >
        <View style={styles.newsContent}>
          {hasImage && (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                transition={300}
                contentFit="cover"
                style={{ width: '100%', aspectRatio }}
              />
            </View>
          )}
          <View style={styles.textSection}>
            <ThemedText numberOfLines={6} style={styles.titleBelowText}>
              {item.title}
            </ThemedText>
            <View style={styles.badgeAndSourcesRow}>
              {badgeInfo && sharedBadgeType && (
                <View style={styles.badgeWrapper}>
                  <FactualityBadge
                    text={badgeInfo.text}
                    type={sharedBadgeType}
                    style={[
                      styles.newsCardBadgeStyles,
                      Platform.OS === 'ios' && styles.iosBadgeShadow,
                      {
                        backgroundColor: theme.colors.card.background,
                      },
                    ]}
                  />
                </View>
              )}
              <View style={styles.sourceIconsContainer}>
                {item.sources &&
                  uniqueSourceIcons.slice(0, MAX_SOURCES).map((source, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.sourceIcon,
                        {
                          marginLeft: idx > 0 ? -8 : 0, // Overlap icons
                          zIndex: uniqueSourceIcons.length - idx, // Higher z-index for later icons
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceIconBorder,
                          {
                            borderColor: theme.colors.card.background,
                            backgroundColor: theme.colors.card.background,
                          },
                        ]}
                      >
                        <SourceIcon sourceUrl={source.uri} size={18} />
                      </View>
                    </View>
                  ))}
                {item.sources && uniqueSourceIcons.length > MAX_SOURCES && (
                  <View
                    style={[
                      styles.moreSourcesIndicator,
                      {
                        backgroundColor: isDark ? '#e0e0e0' : '#808080',
                        borderColor: theme.colors.card.background,
                        marginLeft:
                          uniqueSourceIcons.slice(0, MAX_SOURCES).length > 0
                            ? -8
                            : 0,
                        zIndex: 0,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.moreSourcesText,
                        { color: isDark ? '#333333' : '#ffffff' },
                      ]}
                    >
                      +{uniqueSourceIcons.length - MAX_SOURCES}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableItem: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
      },
      default: {
        // Android and iOS will use the native feedback
      },
    }),
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pressedState: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  newsItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lastNewsItem: {
    marginBottom: 12,
  },
  sourceIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    marginLeft: 0,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  textSection: {
    marginTop: 0,
    padding: 12,
  },
  titleBelowText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  footerLeftSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    gap: 6,
  },
  footerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  navIcon: {
    marginLeft: 0,
  },
  timestampText: {
    display: 'none',
  },
  singleNewsItem: {
    borderWidth: 1,
    borderRadius: 8,
  },
  singleNewsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  newsCardBadgeStyles: {
    borderRadius: 12,
  },
  iosBadgeShadow: {
    shadowColor: '#00000040',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  badgeWrapper: {
    marginLeft: 0,
  },
  moreSourcesIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 3,
    borderWidth: 2,
    zIndex: 4,
  },
  moreSourcesText: {
    fontSize: 9,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.7,
  },
  badgeAndSourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  sourceIconBorder: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 1,
  },
});

export default React.memo(NewsCardItem, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.last_modified_date === nextProps.item.last_modified_date &&
    prevProps.item.fact_check_data?.factuality ===
      nextProps.item.fact_check_data?.factuality &&
    prevProps.onPress === nextProps.onPress
  );
});
