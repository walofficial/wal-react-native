import React from 'react';
import { View, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface NewsCardSkeletonProps {
  itemCount?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.85;
const ITEM_SPACING = 12;

const SkeletonItem = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const skeletonColor = useThemeColor(
    { light: '#E1E4E8', dark: '#333' },
    'icon',
  );

  return (
    <View
      style={[
        styles.skeletonItem,
        { backgroundColor, borderColor: `${borderColor}30` },
      ]}
    >
      <View style={styles.skeletonContent}>
        {/* Title placeholder - simplified to 3 lines */}
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.titleLine,
              { backgroundColor: skeletonColor, width: '90%' },
            ]}
          />
          <View
            style={[
              styles.titleLine,
              { backgroundColor: skeletonColor, width: '80%' },
            ]}
          />
          <View
            style={[
              styles.titleLine,
              { backgroundColor: skeletonColor, width: '60%' },
            ]}
          />
        </View>

        {/* Simple footer placeholder */}
        <View style={styles.skeletonFooter}>
          <View
            style={[styles.footerLine, { backgroundColor: skeletonColor }]}
          />
        </View>
      </View>
    </View>
  );
};

const NewsCardSkeleton: React.FC<NewsCardSkeletonProps> = ({
  itemCount = 3,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonWrapper,
            index > 0 && { marginLeft: ITEM_SPACING },
          ]}
        >
          <SkeletonItem />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  skeletonWrapper: {
    width: ITEM_WIDTH,
  },
  skeletonItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 16,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  titleLine: {
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLine: {
    width: 100,
    height: 12,
    borderRadius: 4,
  },
});

export default NewsCardSkeleton;
