import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ViewProps } from "react-native";
import { StyleSheet, View, Alert } from "react-native";
import type { TapGestureHandlerStateChangeEvent } from "react-native-gesture-handler";
import { State, TapGestureHandler } from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  withRepeat,
  interpolate,
} from "react-native-reanimated";
import type { Camera, VideoFile } from "react-native-vision-camera";
import { CAPTURE_BUTTON_SIZE } from "./Constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@backpackapp-io/react-native-toast";
import { useHaptics } from "@/lib/haptics";
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.05;
const MIN_RECORDING_TIME = 500; // 1 second in milliseconds
const MAX_RECORDING_TIME = 30000; // 30 seconds in milliseconds

interface Props extends ViewProps {
  camera: React.RefObject<Camera>;
  onMediaCaptured: (media: VideoFile, type: "video") => void;

  flash: "off" | "on";

  enabled: boolean;
  setRecordingTimeView: (visible: boolean) => void;
  setIsPressingButton: (isPressingButton: boolean) => void;
  matchId: string;
}

const _CaptureButton: React.FC<Props> = ({
  camera,
  onMediaCaptured,
  flash,
  enabled,
  setIsPressingButton,
  style,
  setRecordingTimeView,
  matchId,
  ...props
}): React.ReactElement => {
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartTime = useRef<number | null>(null);
  const isPressingButton = useSharedValue(false);
  const recordingProgress = useSharedValue(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const haptic = useHaptics();
  useEffect(() => {
    setRecordingTimeView(isRecording);

    // Cleanup function
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
      cancelAnimation(recordingProgress);
    };
  }, [isRecording]);

  const stopRecording = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      await camera.current.stopRecording();

      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      recordingProgress.value = withTiming(0);
    } catch (e) {
      console.error("Failed to stop recording!", e);
    }
  }, [camera, recordingProgress]);

  const startRecording = useCallback(() => {
    try {
      if (camera.current == null) throw new Error("Camera ref is null!");

      camera.current.startRecording({
        videoCodec: "h264",
        fileType: "mp4",
        flash: flash,
        onRecordingError: (error) => {
          console.error("Recording failed!", error);
          setIsRecording(false);
          recordingProgress.value = withTiming(0);
          haptic("Error");
        },
        onRecordingFinished: async (video) => {
          const recordingDuration =
            Date.now() - (recordingStartTime.current || Date.now());
          if (recordingDuration < MIN_RECORDING_TIME) {
            toast.error("ჩანაწერი მოკლეა");
            haptic("Medium");
          } else {
            await AsyncStorage.setItem(
              `lastRecordedVideoPath_${matchId}`,
              video.path
            );
            onMediaCaptured(video, "video");
            haptic("Medium");
          }
          setIsRecording(false);
          recordingProgress.value = withTiming(0);
        },
      });
      recordingStartTime.current = Date.now();
      setIsRecording(true);
      recordingProgress.value = withTiming(1, { duration: MAX_RECORDING_TIME });
      haptic("Medium");

      recordingTimer.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_TIME);
    } catch (e) {
      console.error("Failed to start recording!", e);
      haptic("Medium");
    }
  }, [
    camera,
    flash,
    onMediaCaptured,
    recordingProgress,
    stopRecording,
    matchId,
  ]);

  const onHandlerStateChanged = useCallback(
    async ({ nativeEvent: event }: TapGestureHandlerStateChangeEvent) => {
      console.debug(`state: ${Object.keys(State)[event.state]}`);
      if (event.state === State.ACTIVE) {
        isPressingButton.value = true;
        setIsPressingButton(true);

        if (isRecording) {
          await stopRecording();
        } else {
          startRecording();
        }

        setTimeout(() => {
          isPressingButton.value = false;
          setIsPressingButton(false);
        }, 200);
      }
    },
    [
      isRecording,
      startRecording,
      stopRecording,
      isPressingButton,
      setIsPressingButton,
    ]
  );

  const buttonStyle = useAnimatedStyle(() => {
    let scale: number;
    if (enabled) {
      if (isPressingButton.value) {
        scale = withRepeat(
          withSpring(1, {
            stiffness: 100,
            damping: 1000,
          }),
          -1,
          true
        );
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

  const innerButtonStyle = useAnimatedStyle(() => {
    const size = interpolate(
      recordingProgress.value,
      [0, 1],
      [CAPTURE_BUTTON_SIZE * 0.8, CAPTURE_BUTTON_SIZE * 0.5]
    );
    const borderRadius = isRecording
      ? CAPTURE_BUTTON_SIZE * 0.1
      : interpolate(
          recordingProgress.value,
          [0, 1],
          [CAPTURE_BUTTON_SIZE * 0.4, CAPTURE_BUTTON_SIZE * 0.2]
        );

    return {
      width: size,
      height: size,
      borderRadius: borderRadius,
    };
  });

  return (
    <TapGestureHandler
      enabled={enabled}
      onHandlerStateChange={onHandlerStateChanged}
      shouldCancelWhenOutside={false}
    >
      <Reanimated.View {...props} style={[buttonStyle, style]}>
        <View style={styles.button}>
          <Reanimated.View
            style={[
              styles.innerButton,
              isRecording ? styles.recordingButton : styles.notRecordingButton,
              !isRecording ? innerButtonStyle : {},
            ]}
          />
        </View>
      </Reanimated.View>
    </TapGestureHandler>
  );
};

export const CaptureButton = _CaptureButton;

const styles = StyleSheet.create({
  button: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  innerButton: {
    backgroundColor: "#ff0000",
  },
  notRecordingButton: {},
  recordingButton: {
    width: CAPTURE_BUTTON_SIZE * 0.6,
    height: CAPTURE_BUTTON_SIZE * 0.6,
    borderRadius: 10,
  },
});
