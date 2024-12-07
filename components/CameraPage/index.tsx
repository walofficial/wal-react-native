import * as React from "react";
import { useRef, useState, useCallback, useMemo } from "react";
import type { GestureResponderEvent } from "react-native";
import { Text } from "../ui/text";

import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import type { PinchGestureHandlerGestureEvent } from "react-native-gesture-handler";
import {
  PinchGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";
import type {
  CameraProps,
  CameraRuntimeError,
  PhotoFile,
  VideoFile,
} from "react-native-vision-camera";
import {
  useCameraDevice,
  useCameraFormat,
  useLocationPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";
import { Camera } from "react-native-vision-camera";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  MAX_ZOOM_FACTOR,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "./Constants";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useIsForeground } from "../../hooks/useIsForeground";
import { StatusBarBlurBackground } from "./StatusBarBlurBackground";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import IonIcon from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/core";
import { usePreferredCameraDevice } from "../../hooks/usePreferredCameraDevice";
import { CaptureButton } from "./CaptureButton";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { CaptureButtonPhoto } from "./CaptureButtonPhoto";
import { toast } from "@backpackapp-io/react-native-toast";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;

const getAspectRatio = (width: number, height: number) => {
  const ratio = width / height;
  // Common aspect ratios
  const ratios = {
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "1:1": 1,
    "9:16": 9 / 16,
  };

  // Find the closest matching ratio
  let closest = Object.entries(ratios).reduce((prev, curr) => {
    return Math.abs(curr[1] - ratio) < Math.abs(prev[1] - ratio) ? curr : prev;
  });

  return closest[0];
};

export default function CameraPage({
  showCamera,
}: {
  showCamera: boolean;
}): React.ReactElement {
  const navigation = useNavigation();
  const { taskId } = useLocalSearchParams();

  const [shouldShowPhotoCapture, setShouldShowPhotoCapture] = useState(false);

  const shouldShowMediaTypeSwitch = true;

  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const microphone = useMicrophonePermission();
  const location = useLocationPermission();
  const zoom = useSharedValue(1);
  const isPressingButton = useSharedValue(false);
  const router = useRouter();
  // check if camera page is active
  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [cameraPosition, setCameraPosition] = useState<"front" | "back">(
    "back"
  );

  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [enableNightMode, setEnableNightMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  // camera device settings
  const [preferredDevice] = usePreferredCameraDevice();
  let device = useCameraDevice(cameraPosition);
  if (preferredDevice != null && preferredDevice.position === cameraPosition) {
    // override default device with the one selected by the user in settings
    device = preferredDevice;
  }

  const [targetFps, setTargetFps] = useState(30);

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    {
      videoResolution: {
        // small video resolution
        width: 1080,
        height: 1920,
      },
    },
    { photoAspectRatio: screenAspectRatio },
  ]);

  const fps = Math.min(format?.maxFps ?? 1, targetFps);

  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = format?.supportsPhotoHdr;
  const supports60Fps = useMemo(
    () => device?.formats.some((f) => f.maxFps >= 60),
    [device?.formats]
  );
  const canToggleNightMode = device?.supportsLowLightBoost ?? false;

  //#region Animated Zoom
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);
  const lastSavedRecordingTime = useRef(0);
  useEffect(() => {
    if (recordingTime) {
      lastSavedRecordingTime.current = recordingTime;
    }
  }, [recordingTime]);

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton;
    },
    [isPressingButton]
  );
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error);
  }, []);
  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);
  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      router.replace({
        pathname: `/(tabs)/liveusers/feed/[taskId]/mediapage`,
        params: {
          path: media.path,
          type: type,
          taskId: taskId as string,
          recordingTime: lastSavedRecordingTime.current,
        },
      });
    },
    [navigation]
  );
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  //#endregion

  //#region Tap Gesture
  const onFocusTap = useCallback(
    ({ nativeEvent: event }: GestureResponderEvent) => {
      if (!device?.supportsFocus) return;
      camera.current?.focus({
        x: event.locationX,
        y: event.locationY,
      });
    },
    [device?.supportsFocus]
  );
  const onDoubleTap = useCallback(() => {
    onFlipCameraPressed();
  }, [onFlipCameraPressed]);
  //#endregion

  //#region Effects
  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);
  //#endregion

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startZoom?: number }
  >({
    onStart: (_, context) => {
      context.startZoom = zoom.value;
    },
    onActive: (event, context) => {
      // we're trying to map the scale gesture to a linear zoom here
      const startZoom = context.startZoom ?? 0;
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolate.CLAMP
      );
      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, startZoom, maxZoom],
        Extrapolate.CLAMP
      );
    },
  });
  //#endregion

  useEffect(() => {
    const f =
      format != null
        ? `(${format.photoWidth}x${format.photoHeight} photo / ${format.videoWidth}x${format.videoHeight}@${format.maxFps} video @ ${fps}fps)`
        : undefined;
    console.log(`Camera: ${device?.name} | Format: ${f}`);
  }, [device?.name, format, fps]);

  useEffect(() => {
    location.requestPermission();
  }, [location]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const recordingTimerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isRecording ? 1 : 0),
      transform: [{ translateY: withTiming(isRecording ? -30 : -50) }],
    };
  });

  const videoHdr = format?.supportsVideoHdr && enableHdr;
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr;

  const [currentAspectRatio, setCurrentAspectRatio] = useState<string>("");

  useEffect(() => {
    if (format) {
      const aspectRatio = getAspectRatio(format.videoWidth, format.videoHeight);
      setCurrentAspectRatio(aspectRatio);
      console.log(`Current aspect ratio: ${aspectRatio}`);
    }
  }, [format]);

  return (
    <View style={[styles.container]} className="bg-black">
      {device != null ? (
        <PinchGestureHandler onGestureEvent={onPinchGesture} enabled={isActive}>
          <Reanimated.View
            onTouchEnd={onFocusTap}
            style={StyleSheet.absoluteFill}
          >
            <TapGestureHandler onEnded={onDoubleTap} numberOfTaps={2}>
              <ReanimatedCamera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                ref={camera}
                onInitialized={onInitialized}
                onError={onError}
                onStarted={() => console.log("Camera started!")}
                onStopped={() => console.log("Camera stopped!")}
                onPreviewStarted={() => console.log("Preview started!")}
                onPreviewStopped={() => console.log("Preview stopped!")}
                onOutputOrientationChanged={(o) =>
                  console.log(`Output orientation changed to ${o}!`)
                }
                onPreviewOrientationChanged={(o) =>
                  console.log(`Preview orientation changed to ${o}!`)
                }
                onUIRotationChanged={(degrees) =>
                  console.log(`UI Rotation changed: ${degrees}°`)
                }
                format={format}
                fps={fps}
                photoHdr={photoHdr}
                videoHdr={videoHdr}
                photoQualityBalance="speed"
                lowLightBoost={device.supportsLowLightBoost && enableNightMode}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                exposure={0}
                enableFpsGraph={false}
                outputOrientation="device"
                photo={true}
                video={true}
                audio={microphone.hasPermission}
                enableLocation={location.hasPermission}
              />
            </TapGestureHandler>
          </Reanimated.View>
        </PinchGestureHandler>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Your phone does not have a Camera.</Text>
        </View>
      )}

      <Reanimated.View style={[styles.recordingTimer, recordingTimerStyle]}>
        <Text style={styles.recordingTimerText}>
          {formatTime(recordingTime)}
        </Text>
      </Reanimated.View>
      <View
        className="flex flex-col items-center justify-center "
        style={styles.captureButton}
      >
        {shouldShowMediaTypeSwitch && (
          <View
            className="flex flex-row items-center justify-center mb-4"
            style={{
              opacity: isRecording || !showCamera ? 0 : 1,
            }}
          >
            <TouchableOpacity
              style={[
                styles.switchButton,
                !shouldShowPhotoCapture && styles.switchButtonActive,
              ]}
              onPress={() => setShouldShowPhotoCapture(false)}
            >
              <Text style={styles.switchButtonText}>ვიდეო</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.switchButton,
                shouldShowPhotoCapture && styles.switchButtonActive,
              ]}
              onPress={() => setShouldShowPhotoCapture(true)}
            >
              <Text style={styles.switchButtonText}>ფოტო</Text>
            </TouchableOpacity>
          </View>
        )}

        {shouldShowPhotoCapture && showCamera ? (
          <CaptureButtonPhoto
            camera={camera}
            onMediaCaptured={onMediaCaptured}
            flash={supportsFlash ? flash : "off"}
            enabled={isCameraInitialized && isActive}
            setIsPressingButton={setIsPressingButton}
          />
        ) : showCamera ? (
          <CaptureButton
            camera={camera}
            onMediaCaptured={onMediaCaptured}
            cameraZoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            flash={supportsFlash ? flash : "off"}
            enabled={isCameraInitialized && isActive}
            setRecordingTimeView={(value) => {
              setIsRecording(value);
            }}
            setIsPressingButton={(value) => {
              setIsPressingButton(value);
            }}
          />
        ) : null}
      </View>

      <StatusBarBlurBackground />
      <View
        style={[
          styles.rightButtonRow,
          {
            opacity: showCamera ? 1 : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            toast.remove();
            router.back();
          }}
        >
          <IonIcon name="arrow-back" color="white" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onFlipCameraPressed}>
          <IonIcon name="camera-reverse" color="white" size={24} />
        </TouchableOpacity>
        {supportsFlash && (
          <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
            <IonIcon
              name={flash === "on" ? "flash" : "flash-off"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
        {supports60Fps && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}
          >
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </TouchableOpacity>
        )}
        {supportsHdr && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEnableHdr((h) => !h)}
          >
            <MaterialIcon
              name={enableHdr ? "hdr" : "hdr-off"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
        {canToggleNightMode && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEnableNightMode(!enableNightMode)}
          >
            <IonIcon
              name={enableNightMode ? "moon" : "moon-outline"}
              color="white"
              size={24}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: "rgba(140, 140, 140, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightButtonRow: {
    position: "absolute",
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop + 20 + 40,
  },
  text: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingTimer: {
    position: "absolute",
    alignSelf: "center",
    bottom: SAFE_AREA_PADDING.paddingBottom + 50,
  },
  recordingTimerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginHorizontal: 5,
  },
  switchButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  switchButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
