import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

interface RoomControlsProps {
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  cameraEnabled: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  onDisconnectClick?: () => void;
  onSwitchCamera?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RoomControls({
  micEnabled,
  setMicEnabled,
  cameraEnabled,
  setCameraEnabled,
  onDisconnectClick,
  onSwitchCamera,
}: RoomControlsProps) {
  const insets = useSafeAreaInsets();

  // Animated values for button press effects
  const micScale = useSharedValue(1);
  const cameraScale = useSharedValue(1);
  const switchScale = useSharedValue(1);
  const disconnectScale = useSharedValue(1);

  // Shared animation config
  const springConfig = {
    damping: 10,
    stiffness: 200,
    mass: 0.5,
  };

  // Animated styles
  const micAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: micScale.value }],
      backgroundColor: micEnabled
        ? withTiming('rgba(10, 132, 255, 0.3)')
        : withTiming('rgba(255, 255, 255, 0.1)'),
    };
  });

  const cameraAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cameraScale.value }],
      backgroundColor: cameraEnabled
        ? withTiming('rgba(10, 132, 255, 0.3)')
        : withTiming('rgba(255, 255, 255, 0.1)'),
    };
  });

  const switchAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: switchScale.value }],
    };
  });

  const disconnectAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: disconnectScale.value }],
    };
  });

  // Haptic feedback and animation handlers
  const toggleMic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    micScale.value = withSpring(0.92, springConfig, () => {
      micScale.value = withSpring(1, springConfig);
    });
    setMicEnabled(!micEnabled);
  };

  const toggleCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cameraScale.value = withSpring(0.92, springConfig, () => {
      cameraScale.value = withSpring(1, springConfig);
    });
    setCameraEnabled(!cameraEnabled);
  };

  const handleSwitchCamera = () => {
    if (!onSwitchCamera) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchScale.value = withSpring(0.92, springConfig, () => {
      switchScale.value = withSpring(1, springConfig);
    });
    onSwitchCamera();
  };

  const handleDisconnect = () => {
    if (!onDisconnectClick) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    disconnectScale.value = withSpring(0.92, springConfig, () => {
      disconnectScale.value = withSpring(1, springConfig);
    });
    onDisconnectClick();
  };

  return (
    <>
      {/* Live Indicator */}
      <Animated.View
        entering={FadeIn.duration(600)}
        style={[
          styles.liveIndicator,
          {
            top: 20,
            left: 16,
          },
        ]}
      >
        <View style={styles.liveIndicatorDot} />
        <Text style={styles.liveIndicatorText}>პირდაპირი</Text>
      </Animated.View>

      {/* Controls Container */}
      <BlurView
        intensity={40}
        tint="dark"
        style={[
          styles.blurContainer,
          {
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.controlsRow}>
          <AnimatedPressable
            onPress={toggleMic}
            style={[styles.controlButton, micAnimatedStyle]}
          >
            <Ionicons
              name={micEnabled ? 'mic' : 'mic-off'}
              size={24}
              color="white"
            />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={toggleCamera}
            style={[styles.controlButton, cameraAnimatedStyle]}
          >
            <Ionicons
              name={cameraEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color="white"
            />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleSwitchCamera}
            style={[styles.controlButton, switchAnimatedStyle]}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleDisconnect}
            style={[styles.disconnectButton, disconnectAnimatedStyle]}
          >
            <Ionicons name="close" size={24} color="white" />
          </AnimatedPressable>
        </View>
      </BlurView>
    </>
  );
}

const styles = StyleSheet.create({
  liveIndicator: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
    opacity: 0.9,
  },
  liveIndicatorText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
