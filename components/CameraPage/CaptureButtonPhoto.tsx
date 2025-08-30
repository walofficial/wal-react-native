import React, { useCallback, useRef } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import type { Camera, PhotoFile } from 'react-native-vision-camera';
import { CAPTURE_BUTTON_SIZE } from './Constants';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@/lib/haptics';

const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;

interface Props extends ViewProps {
  camera: React.RefObject<Camera>;
  onMediaCaptured: (media: PhotoFile, type: 'photo') => void;
  flash: 'off' | 'on';
  enabled: boolean;
  setIsPressingButton: (isPressingButton: boolean) => void;
}

const _CaptureButton: React.FC<Props> = ({
  camera,
  onMediaCaptured,
  flash,
  enabled,
  setIsPressingButton,
  style,
  ...props
}): React.ReactElement => {
  const isPressingButton = useSharedValue(false);
  const photoRef = useRef<PhotoFile | null>(null);
  const haptic = useHaptics();
  const takePhoto = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error('Camera ref is null!');

      haptic('Medium');
      const durationStart = Date.now();
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: false,
      });

      photoRef.current = photo;
      const duration = Date.now() - durationStart;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Failed to take photo!', e);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [camera, flash, onMediaCaptured]);

  const onHandlerStateChanged = useCallback(
    async ({ nativeEvent: event }: TapGestureHandlerStateChangeEvent) => {
      console.debug(`state: ${Object.keys(State)[event.state]}`);
      switch (event.state) {
        case State.BEGAN: {
          isPressingButton.value = true;
          setIsPressingButton(true);
          return;
        }
        case State.END:
        case State.FAILED:
        case State.CANCELLED: {
          try {
            await takePhoto();
          } finally {
            isPressingButton.value = false;
            setIsPressingButton(false);
            if (photoRef.current) {
              onMediaCaptured(photoRef.current, 'photo');
              photoRef.current = null;
            }
          }
          return;
        }
        default:
          break;
      }
    },
    [isPressingButton, setIsPressingButton, takePhoto],
  );

  const buttonStyle = useAnimatedStyle(() => {
    let scale: number;
    if (enabled) {
      if (isPressingButton.value) {
        scale = withSpring(1, {
          stiffness: 100,
          damping: 1000,
        });
      } else {
        scale = withSpring(0.9, {
          stiffness: 500,
          damping: 300,
        });
      }
    } else {
      scale = withSpring(0.6, {
        stiffness: 500,
        damping: 300,
      });
    }

    return {
      opacity: withTiming(enabled ? 1 : 0.3, {
        duration: 100,
        easing: Easing.linear,
      }),
      transform: [
        {
          scale: scale,
        },
      ],
    };
  }, [enabled, isPressingButton]);

  return (
    <TapGestureHandler
      enabled={enabled}
      onHandlerStateChange={onHandlerStateChanged}
      shouldCancelWhenOutside={false}
    >
      <Reanimated.View {...props} style={[buttonStyle, style]}>
        <View style={styles.button} />
      </Reanimated.View>
    </TapGestureHandler>
  );
};

export const CaptureButtonPhoto = React.memo(_CaptureButton);

const styles = StyleSheet.create({
  button: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: 'white',
  },
});
