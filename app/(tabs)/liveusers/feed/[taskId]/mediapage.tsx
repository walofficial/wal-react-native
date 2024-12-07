import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ImageLoadEventData, NativeSyntheticEvent } from "react-native";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Image,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { SAFE_AREA_PADDING } from "@/components/CameraPage/Constants";
import Share from "react-native-share";
import { useIsForeground } from "@/hooks/useIsForeground";
import IonIcon from "react-native-vector-icons/Ionicons";
import { Alert } from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { StatusBarBlurBackground } from "@/components/CameraPage/StatusBarBlurBackground";
import { useIsFocused } from "@react-navigation/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import SubmitButton from "@/components/SubmitButton";
import RetryButton from "@/components/RetryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@backpackapp-io/react-native-toast";

const requestSavePermission = async (): Promise<boolean> => {
  // On Android 13 and above, scoped storage is used instead and no permission is needed
  if (Platform.OS !== "android" || Platform.Version >= 33) return true;

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (permission == null) return false;
  let hasPermission = await PermissionsAndroid.check(permission);
  if (!hasPermission) {
    const permissionRequestResult = await PermissionsAndroid.request(
      permission
    );
    hasPermission = permissionRequestResult === "granted";
  }
  return hasPermission;
};

type OnLoadImage = NativeSyntheticEvent<ImageLoadEventData>;
const isVideoOnLoadEvent = (
  event: AVPlaybackStatus | OnLoadImage
): event is AVPlaybackStatus => "isLoaded" in event && event.isLoaded;

export default function MediaPage(): React.ReactElement {
  const { path, type, taskId, recordingTime } = useLocalSearchParams<{
    path: string;
    type: "photo" | "video";
    taskId: string;
    recordingTime: string;
  }>();

  const router = useRouter();
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const isForeground = useIsForeground();
  const isScreenFocused = useIsFocused();
  const isVideoPaused = !isForeground || !isScreenFocused;
  const [savingState, setSavingState] = useState<"none" | "saving" | "saved">(
    "none"
  );
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const loadMediaPath = async () => {
      if (path) {
        setMediaPath(path as string);
      } else {
        const cachedPath = await AsyncStorage.getItem(
          `lastRecordedVideoPath_${taskId}`
        );
        setMediaPath(cachedPath);
      }
    };
    loadMediaPath();

    return () => {
      // Cleanup function
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [path, taskId]);

  useEffect(() => {
    if (videoRef.current) {
      if (isVideoPaused) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  }, [isVideoPaused]);

  const onMediaLoad = useCallback((event: AVPlaybackStatus | OnLoadImage) => {
    if (isVideoOnLoadEvent(event)) {
    } else {
      const source = event.nativeEvent.source;
      // console.log(`Image loaded. Size: ${source.width}x${source.height}`);
    }
  }, []);
  const onMediaLoadEnd = useCallback(() => {
    setHasMediaLoaded(true);
  }, []);
  const onMediaLoadError = useCallback((error: string) => {
    console.error(`failed to load media: ${error}`);
  }, []);

  const onSavePressed = useCallback(async () => {
    try {
      setSavingState("saving");

      const hasPermission = await requestSavePermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission denied!",
          "Vision Camera does not have permission to save the media to your camera roll."
        );
        return;
      }
      await CameraRoll.save(`file://${path}`, {
        type: type as "video" | "photo",
      });
      setSavingState("saved");
      toast.success("შენახულია", {
        id: "save-success",
      });
      // Remove the saved video path from AsyncStorage after saving to camera roll
      await AsyncStorage.removeItem(`lastRecordedVideoPath_${taskId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      setSavingState("none");
      Alert.alert(
        "Failed to save!",
        `An unexpected error occured while trying to save your ${type}. ${message}`
      );
    }
  }, [path, type, taskId]);

  const onSharePressed = useCallback(async () => {
    try {
      const options = {
        title: "Share via",
        url: `file://${mediaPath}`,
        type: type === "photo" ? "image/jpeg" : "video/mp4",
        failOnCancel: false,
      };

      await Share.open(options);
    } catch (error) {
      console.log("Error =>", error);
      Alert.alert(
        "Failed to share!",
        "An unexpected error occurred while trying to share your media."
      );
    }
  }, [mediaPath, type]);

  const source = useMemo(() => ({ uri: `file://${mediaPath}` }), [mediaPath]);
  const recordingSource = useMemo(() => ({ uri: mediaPath }), [mediaPath]);

  useEffect(() => {
    toast.dismiss();
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          if (
            status.didJustFinish ||
            (status.durationMillis &&
              status.durationMillis - 100 < status.positionMillis)
          ) {
            await videoRef.current.replayAsync();
          } else {
            await videoRef.current.playAsync();
          }
        }
        setIsPlaying(!isPlaying);
      } else {
        await videoRef.current?.loadAsync(source);
        setIsPlaying(true);
        await videoRef.current?.playAsync();
      }
    }
  }, [isPlaying]);

  const handleBack = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.unloadAsync();
    }
    router.back();
  }, [router]);

  const handleAcceptCaption = useCallback(() => {
    Keyboard.dismiss();
    setIsInputFocused(false);
  }, []);

  const dismissKeyboard = useCallback(() => {
    if (isInputFocused) {
      Keyboard.dismiss();
      setIsInputFocused(false);
    }
  }, [isInputFocused]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container]}>
        {!hasMediaLoaded && (
          <View>
            <ActivityIndicator color="black" size="large" />
          </View>
        )}
        {type === "photo" && (
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoadEnd={onMediaLoadEnd}
            onLoad={onMediaLoad}
          />
        )}
        {type === "video" && (
          <>
            <Video
              ref={videoRef}
              source={source}
              style={StyleSheet.absoluteFill}
              shouldPlay={!isVideoPaused}
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              isMuted={true}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded && !hasMediaLoaded) {
                  onMediaLoad(status);
                  onMediaLoadEnd();
                }
                setIsPlaying(status.isLoaded ? status.isPlaying : false);
              }}
              onError={(error) => onMediaLoadError(error)}
            />
            <TouchableOpacity
              style={[styles.playPauseOverlay, { opacity: isPlaying ? 0 : 1 }]}
              onPress={togglePlayPause}
            >
              <IonIcon
                name="play"
                size={50}
                color="white"
                style={styles.icon}
              />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <IonIcon name="close" size={35} color="white" style={styles.icon} />
        </TouchableOpacity>

        <KeyboardAvoidingView behavior="padding">
          <View style={[styles.captionContainer]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.captionInput,
                isInputFocused && styles.captionInputFocused,
                {
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: 8,
                },
              ]}
              placeholder="დაამატე აღწერა..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={caption}
              onChangeText={setCaption}
              multiline={false}
              maxLength={150}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            {isInputFocused && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptCaption}
              >
                <IonIcon name="checkmark" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={onSavePressed}
                disabled={savingState !== "none"}
              >
                {savingState === "none" && (
                  <IonIcon
                    name="download"
                    size={35}
                    color="white"
                    style={styles.icon}
                  />
                )}
                {savingState === "saved" && (
                  <IonIcon
                    name="checkmark"
                    size={35}
                    color="white"
                    style={styles.icon}
                  />
                )}
                {savingState === "saving" && (
                  <ActivityIndicator color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={onSharePressed}
              >
                <IonIcon
                  name="share-social"
                  size={35}
                  color="white"
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <RetryButton />
              <SubmitButton
                onSubmit={handleBack}
                mediaBlob={recordingSource}
                isPhoto={type === "photo"}
                videoDuration={recordingTime}
                caption={caption.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        <StatusBarBlurBackground />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    top: SAFE_AREA_PADDING.paddingTop,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  saveButton: {
    width: 40,
    height: 40,
  },
  shareButton: {
    width: 40,
    height: 40,
  },
  icon: {
    textShadowColor: "black",
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
  compressionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  compressionText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 1,
    elevation: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  captionInput: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "white",
    fontSize: 16,
    height: 40,
  },
  captionInputFocused: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
