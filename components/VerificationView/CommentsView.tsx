import React, {
  useRef,
  useCallback,
  useMemo,
  memo,
  useState,
  useEffect,
} from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import CommentsList from '@/components/Comments/CommentsList';
import useAuth from '@/hooks/useAuth';
import LiveStreamViewer from '@/components/LiveStreamViewer';
import SpaceView from '@/components/FeedItem/SpaceView';
import { FeedPost, LocationFeedPost, Source, User } from '@/lib/api/generated';
import { getVideoSrc } from '@/lib/utils';
import { useAtom } from 'jotai';
import FeedActions from '../FeedItem/FeedActions';
import { FontSizes, useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
import { SourceIcon } from '@/components/SourceIcon';
import { activeSourcesState, newsBottomSheetState } from '@/lib/atoms/news';
import PostHeader from './PostHeader';
import FeedItemMediaContent from '@/components/FeedItem/MediaContent';
import FactCheckBox from '@/components/ui/FactCheckBox';
import AISummaryBox from '@/components/ui/AISummaryBox';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import LinkPreview from '@/components/LinkPreview';
import CommentInput from '../Comments/CommentInput';
import useKeyboardVerticalOffset from '@/hooks/useKeyboardVerticalOffset';
import { isIOS } from '@/lib/platform';
import RenderMdx from '../RenderMdx/index';
import useVerificationById from '@/hooks/useVerificationById';
import NewsSourcesBottomSheet from '../FeedItem/NewsSourcesBottomSheet';
import BottomSheet, { BottomSheetModal } from '@gorhom/bottom-sheet';
import FactCheckBottomSheet from '../FactCheckBottomSheet';
import { useUniqueSources } from '@/utils/sourceUtils';
import useFeeds from '@/hooks/useFeeds';
import { t } from '@/lib/i18n';

// Tab types for news content
type NewsTab = 'neutral' | 'opposition' | 'government';

// News Tabs Component
const NewsTabs = memo(
  ({
    activeTab,
    onTabChange,
    tabContentAvailability,
  }: {
    activeTab: NewsTab;
    onTabChange: (tab: NewsTab) => void;
    tabContentAvailability: Record<NewsTab, boolean>;
  }) => {
    const theme = useTheme();
    const { isDarkColorScheme } = useColorScheme();

    const tabs = [
      {
        key: 'neutral' as NewsTab,
        label: t('common.neutral'),
        color: isDarkColorScheme ? '#6b7280' : '#4b5563',
      },
      {
        key: 'opposition' as NewsTab,
        label: t('common.opposition'),
        color: isDarkColorScheme ? '#dc2626' : '#b91c1c',
      },
      {
        key: 'government' as NewsTab,
        label: t('common.government'),
        color: isDarkColorScheme ? '#2563eb' : '#1d4ed8',
      },
    ];

    return (
      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: isDarkColorScheme
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
          },
        ]}
      >
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const hasContent = tabContentAvailability[tab.key];
            const isActive = activeTab === tab.key;
            const isDisabled = !hasContent;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? tab.color : 'transparent',
                    opacity: isDisabled ? 0.6 : 1,
                  },
                ]}
                onPress={() => hasContent && onTabChange(tab.key)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive
                        ? '#ffffff'
                        : isDisabled
                          ? isDarkColorScheme
                            ? 'rgba(255, 255, 255, 0.5)'
                            : 'rgba(0, 0, 0, 0.5)'
                          : isDarkColorScheme
                            ? 'rgba(255, 255, 255, 0.7)'
                            : 'rgba(0, 0, 0, 0.7)',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

NewsTabs.displayName = 'NewsTabs';

// Reusable component for rendering sources section
const SourcesSection = memo(
  ({
    sources,
    onPress,
  }: {
    sources?: Array<Source> | null;
    onPress: () => void;
  }) => {
    const theme = useTheme();
    const { isDarkColorScheme } = useColorScheme();
    const maxSources = 5;
    if (!sources || sources.length === 0) return null;

    // Filter sources to only include unique domains/hosts
    const uniqueSources = useUniqueSources(sources);

    return (
      <TouchableOpacity
        style={[
          styles.sourcesHorizontalContainer,
          styles.sourcesContainer,
          {
            backgroundColor: isDarkColorScheme
              ? 'rgba(255, 255, 255, 0.04)'
              : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDarkColorScheme
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
            paddingVertical: 12,
            paddingHorizontal: 16,
          },
        ]}
        onPress={onPress}
      >
        <View style={styles.sourcesRow}>
          <View style={styles.sourcesIconsContainer}>
            {uniqueSources.slice(0, maxSources).map((source, index) => (
              <SourceIcon
                key={index}
                sourceUrl={source.uri || ''}
                fallbackUrl={source.uri || ''}
              />
            ))}
            {uniqueSources.length > maxSources && (
              <View
                style={[
                  styles.sourceIconRounded,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <Text
                  style={[styles.sourceCountText, { color: theme.colors.text }]}
                >
                  +{uniqueSources.length - maxSources}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.sourcesLabel,
              {
                backgroundColor: isDarkColorScheme
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text
              style={[
                styles.sourcesLabelText,
                { color: theme.colors.text, opacity: 0.8 },
              ]}
            >
              {uniqueSources.length} {t('common.sources')}
              {''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

SourcesSection.displayName = 'SourcesSection';

// Post Content Component
const PostContent = memo(
  ({
    verification,
    verificationId,
    user,
  }: {
    verification: LocationFeedPost;
    verificationId: string;
    user?: User;
  }) => {
    const theme = useTheme();

    // Calculate which tabs have content
    const tabContentAvailability: Record<NewsTab, boolean> = useMemo(
      () => ({
        neutral: !!verification.neutral_summary?.trim(),
        opposition: !!verification.opposition_summary?.trim(),
        government: !!verification.government_summary?.trim(),
      }),
      [
        verification.neutral_summary,
        verification.opposition_summary,
        verification.government_summary,
      ],
    );

    // Find the first tab that has content, defaulting to neutral if none have content
    const getInitialActiveTab = useCallback((): NewsTab => {
      if (tabContentAvailability.neutral) return 'neutral';
      if (tabContentAvailability.opposition) return 'opposition';
      if (tabContentAvailability.government) return 'government';
      return 'neutral'; // fallback
    }, [tabContentAvailability]);

    const [activeTab, setActiveTab] = useState<NewsTab>(getInitialActiveTab());

    // Update active tab if current tab loses content
    useEffect(() => {
      if (!tabContentAvailability[activeTab]) {
        setActiveTab(getInitialActiveTab());
      }
    }, [activeTab, tabContentAvailability, getInitialActiveTab]);

    const imageUrl = verification.image_gallery_with_dims?.[0];
    const mediaSource = getVideoSrc(verification);
    const title = verification.title;
    const isLive = verification.is_live;
    const isSpace = verification.is_space;

    // IMAGE GALLERY IS DEPRECATED we should use image_gallery_with_dims instead.
    const realTimeImageUrl =
      verification?.image_gallery_with_dims?.[0]?.url || imageUrl;

    const localLinkPreview = useLinkPreview(
      verification.text_content || '',
      false,
    );
    const hasPreview =
      !!verification.preview_data || !!localLinkPreview.previewData;
    const visibleTextContent = hasPreview
      ? (verification?.text_content || '')
          .replace(/(https?:\/\/[^\s]+)/g, '')
          .trim()
      : (verification?.text_content || '').trim();
    // --- END FEED ITEM-LIKE PREVIEW LOGIC ---

    // Handle Space view
    if (isSpace && verification.livekit_room_name) {
      return (
        <View style={styles.postContentContainer}>
          <View style={styles.spaceContainer}>
            <SpaceView
              description={verification.text_content || ''}
              roomName={verification.livekit_room_name}
              isHost={!!user && verification.assignee_user?.id === user.id}
              scheduledAt={verification.scheduled_at || undefined}
            />
          </View>
          <View style={styles.actionsContainer}>
            <FeedActions
              verificationId={verificationId}
              sourceComponent={null}
              // isOwner={!!user && verification.assignee_user?.id === user.id}
            />
          </View>
        </View>
      );
    }
    // Handle Live stream
    if (isLive && verification.livekit_room_name) {
      return (
        <View style={styles.postContentContainer}>
          <View style={styles.textContentContainer}>
            {title && (
              <Text style={[styles.titleText, { color: theme.colors.text }]}>
                {title}
              </Text>
            )}
            {visibleTextContent && (
              <Text
                style={[
                  styles.textContent,
                  { color: theme.colors.text, opacity: 0.9 },
                ]}
              >
                {visibleTextContent}
              </Text>
            )}
            <LiveStreamViewer
              liveKitRoomName={verification.livekit_room_name}
              topControls={<View />}
            />
          </View>
          <View style={styles.actionsContainer}>
            <FeedActions
              verificationId={verificationId}
              sourceComponent={null}
              // isOwner={!!user && verification.assignee_user?.id === user.id}
            />
          </View>
        </View>
      );
    }
    // Regular post
    return (
      <View style={styles.postContentContainer}>
        <View style={styles.textContentContainer}>
          {title && (
            <Text
              style={[
                styles.titleText,
                {
                  color: theme.colors.text,
                  opacity: 0.9, // Reduced opacity to make it less prominent
                },
              ]}
            >
              {title}
            </Text>
          )}

          {verification.is_generated_news &&
            (verification.government_summary ||
              verification.opposition_summary ||
              verification.neutral_summary) && (
              <NewsTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabContentAvailability={tabContentAvailability}
              />
            )}

          {verification.is_generated_news ? (
            // Render tab-specific content for generated news
            <View style={{ opacity: 1 }}>
              <RenderMdx
                content={
                  activeTab === 'government'
                    ? verification.government_summary || ''
                    : activeTab === 'opposition'
                      ? verification.opposition_summary || ''
                      : verification.neutral_summary || ''
                }
              />
            </View>
          ) : (
            // Render original content for non-generated news
            visibleTextContent && (
              <View style={{ opacity: 1 }}>
                <RenderMdx content={visibleTextContent} />
              </View>
            )
          )}
          <FeedItemMediaContent
            videoUrl={mediaSource}
            imageGalleryWithDims={verification.image_gallery_with_dims || []}
            isLive={isLive}
            isVisible={true}
            verificationId={verificationId}
            name={verification.assignee_user?.username || ''}
            time={verification.last_modified_date}
            avatarUrl={
              verification.assignee_user?.photos[0]?.image_url[0] || ''
            }
            livekitRoomName={verification.livekit_room_name || undefined}
            isSpace={isSpace}
            scheduledAt={verification.scheduled_at || undefined}
            text={verification.text_content || undefined}
            thumbnail={verification.verified_media_playback?.thumbnail}
            mediaAlt="Verification image"
            creatorUserId={verification.assignee_user?.id}
            previewData={
              verification.preview_data ||
              localLinkPreview.previewData ||
              undefined
            }
            hasAISummary={
              verification.ai_video_summary_status === 'COMPLETED' ||
              verification.ai_video_summary_status === 'PENDING'
            }
            liveEndedAt={verification.live_ended_at || undefined}
          />
          {hasPreview && !imageUrl && !realTimeImageUrl && (
            <LinkPreview
              // @ts-ignore
              previewData={
                verification.preview_data
                  ? verification.preview_data
                  : localLinkPreview.previewData
              }
              isLoading={false}
              hasAISummary={
                verification.ai_video_summary_status === 'COMPLETED' ||
                verification.ai_video_summary_status === 'PENDING'
              }
              verificationId={verificationId}
              inFeedView={false}
              factuality={verification.fact_check_data?.factuality}
            />
          )}

          {verification.external_video &&
            verification.ai_video_summary_status === 'COMPLETED' && (
              <AISummaryBox
                aiSummary={verification.ai_video_summary || undefined}
                videoData={verification.external_video}
                status={verification.ai_video_summary_status}
                style={styles.aiSummaryBox}
              />
            )}
        </View>

        {verification.fact_check_data && (
          <FactCheckBox
            factCheckData={verification.fact_check_data}
            style={styles.factCheckBox}
          />
        )}

        <View style={styles.actionsContainer}>
          <FeedActions
            verificationId={verificationId}
            sourceComponent={null}
            // isOwner={!!user && verification.assignee_user?.id === user.id}
          />
        </View>
      </View>
    );
  },
);

PostContent.displayName = 'PostContent';

// Main CommentsView Component
const CommentsView = ({
  verification: initialVerification,
  verificationId,
}: {
  verification: FeedPost;
  verificationId: string;
}) => {
  const { user } = useAuth();
  const { headerHeight } = useFeeds();

  const theme = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const factCheckBottomSheetRef = useRef<BottomSheetModal>(null);

  // Use the same hook to ensure fresh data and consistent caching
  const { data: verificationData } = useVerificationById(verificationId, true, {
    refetchInterval: 5000,
  });

  // Use fresh data if available, otherwise fall back to initial data
  const verification = verificationData || initialVerification;

  const keyboardVerticalOffset = useKeyboardVerticalOffset();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NewsSourcesBottomSheet bottomSheetRef={bottomSheetRef} />
      <FactCheckBottomSheet bottomSheetRef={factCheckBottomSheetRef} />
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.container}>
          {/* Header Section */}
          {!verification.title ? (
            <PostHeader
              name={verification.assignee_user?.username || ''}
              time={verification.last_modified_date}
              avatarUrl={
                verification.assignee_user?.photos[0]?.image_url[0] || ''
              }
              posterId={verification.assignee_user?.id || ''}
              headerHeight={headerHeight}
              hasFactCheck={!!verification.fact_check_data}
              isLive={verification.is_live}
            />
          ) : (
            <View
              style={{ paddingTop: headerHeight - 20, position: 'relative' }}
            ></View>
          )}

          <PostContent
            verification={verification}
            verificationId={verificationId}
            user={user}
          />

          <CommentsList postId={verificationId} />
        </View>
      </ScrollView>
      {user && (
        <KeyboardAvoidingView
          keyboardVerticalOffset={keyboardVerticalOffset}
          behavior={isIOS ? 'padding' : 'padding'}
          style={{
            backgroundColor: 'transparent',
          }}
        >
          <CommentInput postId={verificationId} />
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  postContentContainer: {
    marginBottom: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  spaceContainer: {
    padding: 12,
  },
  textContentContainer: {
    paddingHorizontal: 8,
  },
  textContent: {
    fontSize: FontSizes.medium,
    fontWeight: '400',
    letterSpacing: 0.5,
    lineHeight: 24,
    marginBottom: 5,
  },
  mediaContainer: {
    position: 'relative',
    paddingHorizontal: 8,
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sourcesHorizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourcesContainer: {
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 16,
    gap: 4,
  },
  sourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sourcesIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourcesLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourcesLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sourceIconRounded: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sourceCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  factCheckBadgePosition: {
    position: 'absolute',
    top: -24,
    left: 0,
    zIndex: 10,
  },
  titleContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factCheckBox: {
    marginHorizontal: 6,
    marginVertical: 12,
  },
  dateText: {
    color: 'rgb(101, 104, 108)',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  aiSummaryBox: {
    marginBottom: 8,
  },
  commentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
  },
  commentsHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentsHeaderText: {
    fontWeight: '500',
    fontSize: 16,
  },
  emptyCommentsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: 'rgb(101, 104, 108)',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
  postHeaderFactCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  topMetadataContainer: {
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sourcesCompactContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 10,
  },
  sourcesCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceIconsCompactContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  sourceIconCompact: {
    marginLeft: 0,
  },
  sourcesCompactLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  factualityWrapper: {},
  factualityBadge: {
    borderRadius: 12,
  },
  moreSourcesIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
    borderWidth: 1.5,
    zIndex: 4,
  },
  moreSourcesText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sourceIconImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  tabsContainer: {
    marginVertical: 12,
    borderRadius: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default memo(CommentsView);
