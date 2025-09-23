import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { Image as ImageIcon, Film, X } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useColorScheme } from '@/lib/useColorScheme';

type MediaKind = 'photo' | 'video';

interface UploadingToastProps {
  label?: string;
  progress: number; // 0..1
  mediaKind: MediaKind;
  cancellable?: boolean;
  onCancel?: () => void;
  previewUri?: string;
}

export const UploadingToast: React.FC<UploadingToastProps> = ({
  label = 'Uploading…',
  progress,
  mediaKind,
  cancellable = true,
  onCancel,
  previewUri,
}) => {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const clampedProgress = useMemo(() => {
    return Math.max(0, Math.min(1, progress));
  }, [progress]);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(clampedProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress, progressValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const Icon = mediaKind === 'photo' ? ImageIcon : Film;

  // Apple-like gray color for progress bar
  const progressColor = colorScheme.isDarkColorScheme ? '#8E8E93' : '#8E8E93';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View style={styles.leftRow}>
          {typeof previewUri === 'string' && previewUri.length > 0 ? (
            <View style={[styles.previewWrap, { borderColor: colors.border }]}>
              {mediaKind === 'photo' ? (
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewMedia}
                />
              ) : (
                <Video
                  source={{ uri: previewUri }}
                  style={styles.previewMedia}
                  resizeMode={ResizeMode.COVER}
                  isMuted
                  shouldPlay={false}
                  useNativeControls={false}
                />
              )}
            </View>
          ) : (
            <View style={[styles.iconWrap, { borderColor: colors.border }]}>
              <Icon size={18} color={colors.text} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
        </View>
        <View style={styles.rightRow}>
          {/* <ActivityIndicator size="small" color={colors.text} /> */}
          <Text style={[styles.percent, { color: colors.text }]}>{
            Math.round(clampedProgress * 100)
          }%</Text>
          {cancellable ? (
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              style={[styles.cancelButton, { borderColor: colors.border }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.card.background }
        ]}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(clampedProgress * 100), min: 0, max: 100 }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: progressColor,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    // iOS-like subtle border; color provided from theme via style
    boxShadow: '0px 6px 16px rgba(0,0,0,0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 as unknown as number,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  previewWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  percent: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  cancelButton: {
    marginLeft: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default UploadingToast;
