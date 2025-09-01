import React from 'react';
import {
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Platform,
  Animated, // Keep Animated.View as it accepts animated styles via the style prop
  ViewStyle,
  StyleProp,
} from 'react-native';

export type FactualityBadgeType = 'truth' | 'misleading' | 'needs-context';

export interface FactualityBadgeProps {
  text: string;
  type: FactualityBadgeType;
  style?: StyleProp<ViewStyle>; // Use ViewStyle for style prop with Animated.View
  onPress?: () => void;
}

const FactualityBadge: React.FC<FactualityBadgeProps> = ({
  text,
  type,
  style,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDarkColorScheme = colorScheme === 'dark';
  let backgroundColor, textColor;

  switch (type) {
    case 'truth':
      textColor = isDarkColorScheme ? '#34d399' : '#065f46'; // Whiter green in dark mode
      backgroundColor = isDarkColorScheme ? '#065f46' : '#d1fae5'; // Solid dark green background in dark mode
      break;
    case 'needs-context': // Blue
      textColor = isDarkColorScheme ? '#93c5fd' : '#1e40af'; // Whiter blue in dark mode
      backgroundColor = isDarkColorScheme ? '#1e3a8a' : '#dbeafe'; // Solid dark blue background in dark mode
      break;
    case 'misleading': // Red/Orange
      textColor = isDarkColorScheme ? '#fca5a5' : '#dc2626'; // Whiter red in dark mode
      backgroundColor = isDarkColorScheme ? '#991b1b' : '#fee2e2'; // Solid dark red background in dark mode
      break;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={styles.touchableWrapper}
    >
      <Animated.View style={[styles.badge, { backgroundColor }, style]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableWrapper: {
    // Added wrapper for TouchableOpacity to not interfere with badge's own layout
    // This ensures the touchable area matches the badge visual if no specific style is passed to expand it.
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    // Note: Platform-specific shadows from NewsCardItem are not here by default.
    // They can be added via the `style` prop if needed.
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.24,
  },
});

export default FactualityBadge;
