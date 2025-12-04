import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '../ui/text';
import { useColorScheme } from '@/lib/useColorScheme';
import { FontSizes } from '@/lib/theme';
import SourceIcon from '../SourceIcon';
import { isWeb } from '@/lib/platform';
import { t } from '@/lib/i18n';

// Define layout type
type TabLayout = { x: number; width: number };

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  isCurrentLocation?: boolean;
  task?: any;
  address?: string;
  image?: string;
}

interface TabBarProps {
  showTabs: boolean;
  tabItems: TabItem[];
  activeTab: string;
  showLocationTabs: boolean;
  onTabPress: (tabKey: string) => void;
  feedId?: string;
}

// Fast fade animation config for low-end devices (150ms is snappy)
const FADE_IN = FadeIn.duration(150);
const FADE_OUT = FadeOut.duration(100);

export function TabBar({
  showTabs,
  tabItems,
  activeTab,
  showLocationTabs,
  onTabPress,
  feedId,
}: TabBarProps) {
  const { isDarkColorScheme } = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<{ [key: string]: TabLayout }>({});
  const scrollViewWidth = useRef(0);

  const handleTabPress = useCallback(
    (tabKey: string) => {
      onTabPress(tabKey);

      // Scroll the horizontal tab bar
      const layout = tabLayouts.current[tabKey];
      const svWidth = scrollViewWidth.current;

      if (layout && svWidth > 0 && scrollViewRef.current) {
        const targetX = Math.max(0, layout.x + layout.width / 2 - svWidth / 2);
        scrollViewRef.current.scrollTo({ x: targetX, animated: true });
      }
    },
    [onTabPress],
  );

  // Memoized content tab items - only recreate when translation changes
  const contentTabItems = useMemo(
    () => [
      {
        key: 'last24h',
        label: t('common.all'),
        icon: null,
      },
      {
        key: 'social_media_only',
        label: '',
        icon: (
          <SourceIcon
            sourceUrl="facebook.com"
            size={24}
            style={styles.tabIcon}
            noBackground
          />
        ),
      },
      {
        key: 'youtube_only',
        label: '',
        icon: (
          <SourceIcon
            sourceUrl="youtube.com"
            size={24}
            style={styles.tabIcon}
            noBackground
          />
        ),
      },
    ],
    [],
  );

  const displayTabItems = showLocationTabs ? tabItems : contentTabItems;

  // Early return - no animation needed, just don't render
  if (isWeb || !showTabs) {
    return null;
  }
  return (
    <Animated.View
      entering={FADE_IN}
      exiting={FADE_OUT}
      style={styles.tabBarContainer}
    >
      <ScrollView
        ref={scrollViewRef}
        decelerationRate={0.9}
        style={{ width: '100%' }}
        contentContainerStyle={styles.tabBarScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          scrollViewWidth.current = event.nativeEvent.layout.width;
        }}
      >
        {displayTabItems.map((tab: TabItem) => {
          const isActive = showLocationTabs
            ? feedId ===
              (tab.key.startsWith('nearTask_')
                ? tab.key.replace('nearTask_', '')
                : tab.key)
            : activeTab === tab.key;

          // Define colors based on tab type with new styling
          const getActiveColors = () => {
            return {
              backgroundColor: isDarkColorScheme ? '#333' : '#f0f0f0', // Light gray for active
              borderColor: isDarkColorScheme ? '#555' : '#e0e0e0',
            };
          };

          const getInactiveColors = () => {
            return isDarkColorScheme
              ? { backgroundColor: '#111', borderColor: '#333' }
              : { backgroundColor: '#f9f9f9', borderColor: '#e5e7eb' };
          };

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                { borderWidth: 1 },
                isActive ? getActiveColors() : getInactiveColors(),
                isActive && styles.activeTabShadow, // Add shadow for active tabs
              ]}
              accessibilityLabel={tab.label}
              activeOpacity={0.8}
              onPress={() => handleTabPress(tab.key)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                tabLayouts.current[tab.key] = { x, width };
              }}
            >
              {/* Render image in circle for location tabs */}
              {showLocationTabs && tab.image && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: tab.image }} style={styles.tabImage} />
                </View>
              )}

              {/* Render icon for content tabs */}
              {!showLocationTabs && tab.icon}

              {tab.label && (
                <Text
                  style={[
                    styles.tabButtonText,
                    isDarkColorScheme ? { color: '#ccc' } : { color: '#222' },
                    isActive
                      ? {
                          color: isDarkColorScheme ? '#fff' : '#000',
                          fontWeight: '700',
                        }
                      : {},
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 2,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeTabShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  imageContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  tabImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tabIcon: {},
  tabButtonText: {
    fontSize: FontSizes.medium, // Same size as content tabs
    fontWeight: '600',
    textAlign: 'center',
  },
});
