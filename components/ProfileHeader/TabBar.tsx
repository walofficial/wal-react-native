import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
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
  image?: string; // Add image property
}

interface TabBarProps {
  showTabs: boolean;
  tabItems: TabItem[];
  activeTab: string;
  showLocationTabs: boolean;
  onTabPress: (tabKey: string) => void;
  feedId?: string;
}

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
  const isMountedRef = useRef(true);

  // Animated values for tab bar
  const tabBarOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (showTabs) {
      tabBarOpacity.value = withTiming(1, { duration: 300 });
    } else {
      tabBarOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [showTabs, tabBarOpacity]);

  const tabBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: tabBarOpacity.value,
    };
  });

  const handleTabPress = (tabKey: string) => {
    if (!isMountedRef.current) return;

    onTabPress(tabKey);

    // Scroll the horizontal tab bar
    const layout = tabLayouts.current[tabKey];
    const svWidth = scrollViewWidth.current;

    if (layout && svWidth > 0 && scrollViewRef.current) {
      // Calculate target x offset to center the tab
      let targetX = layout.x + layout.width / 2 - svWidth / 2;
      targetX = Math.max(0, targetX);
      scrollViewRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  // Content tab items configuration
  const contentTabItems = [
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
  ];
  
  const displayTabItems = showLocationTabs ? tabItems : contentTabItems;

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (isWeb || !showTabs) {
    return null;
  }
  return (
    <Animated.View style={[styles.tabBarContainer, tabBarAnimatedStyle]}>
      <ScrollView
        ref={scrollViewRef}
        decelerationRate={0.9}
        style={{ width: '100%' }}
        contentContainerStyle={styles.tabBarScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          if (isMountedRef.current) {
            scrollViewWidth.current = event.nativeEvent.layout.width;
          }
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
                if (isMountedRef.current) {
                  // Store layout info for scrolling
                  const layout = event.nativeEvent.layout;
                  tabLayouts.current[tab.key] = {
                    x: layout.x,
                    width: layout.width,
                  };
                }
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
