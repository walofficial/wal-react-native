import React, { useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  TouchableOpacity,
  DimensionValue,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from "react-native";
import { BlueskyVideoView } from "@haileyok/bluesky-video";
import { convertToCDNUrl } from "@/lib/utils";
import { useIsFocused } from "@react-navigation/native";
import MuteButton from "../MuteButton";
import { useGlobalMute } from "@/hooks/useGlobalMute";
import { isDev } from "@/lib/api/config";
import { Image, ImageBackground } from "expo-image";
import { isNative } from "@/lib/platform";
import { useTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

interface SimplifiedVideoPlaybackProps {
  src: string;
  shouldPlay: boolean;
  showPlayButton?: boolean;
  onVideoPress?: (currentTime: number) => void;
  loop?: boolean;
  isLive?: boolean;
  thumbnail?: string;
  aspectRatio?: number;
}

// Add type definition for the timeRemaining event
interface TimeRemainingEvent {
  timeRemaining: number;
  duration?: number; // Make duration optional since it might not always be available
}

// Component for constraining video to portrait aspect ratio
function ConstrainedVideo({
  aspectRatio = 3 / 4,
  children,
}: {
  aspectRatio?: number;
  children: React.ReactNode;
}) {
  const outerAspectRatio = React.useMemo<DimensionValue>(() => {
    // For portrait view, we want to ensure height > width
    // If aspectRatio < 1, it's already portrait, otherwise we need to constrain it
    const portraitRatio = aspectRatio < 1 ? aspectRatio : 3 / 4; // Default to 3:4 portrait if not already portrait

    const ratio = isNative
      ? Math.min(1 / portraitRatio, 16 / 9) // 9:16 portrait bounding box
      : Math.min(1 / portraitRatio, 4 / 3); // 3:4 portrait bounding box for non-native

    return `${ratio * 100}%` as DimensionValue;
  }, [aspectRatio]);

  return (
    <View style={{ width: "100%" }}>
      <View style={{ overflow: "hidden", paddingTop: outerAspectRatio }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: "row",
          }}
        >
          <View
            style={{
              height: "100%",
              width: aspectRatio < 1 ? undefined : "75%", // 3:4 ratio for non-portrait videos
              aspectRatio: aspectRatio < 1 ? aspectRatio : 3 / 4,
              alignSelf: "center",
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: "rgba(0,0,0,0.25)",
              marginHorizontal: "auto",
            }}
          >
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

// Add TimeIndicator component
function TimeIndicator({
  time,
  style,
}: {
  time: number;
  style?: StyleProp<ViewStyle>;
}) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: 6,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 999,
          minHeight: 21,
        },
        style,
      ]}
    >
      <Text style={{ color: "white", fontSize: 11, fontWeight: "500" }}>
        {timeStr}
      </Text>
    </View>
  );
}

// Add ControlButton component
function ControlButton({
  onPress,
  children,
  label,
  accessibilityHint,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  label: string;
  accessibilityHint: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          position: "absolute",
          borderRadius: 999,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          paddingHorizontal: 4,
          paddingVertical: 4,
          bottom: 6,
          minHeight: 21,
          minWidth: 21,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
      >
        {children}
      </Pressable>
    </View>
  );
}

// Add VideoControls component
function VideoControls({
  enterFullscreen,
  toggleMuted,
  togglePlayback,
  timeRemaining,
  isPlaying,
  isMuted,
}: {
  enterFullscreen: () => void;
  toggleMuted: () => void;
  togglePlayback: () => void;
  timeRemaining: number;
  isPlaying: boolean;
  isMuted: boolean;
}) {
  const theme = useTheme();
  const showTime = !isNaN(timeRemaining);

  return (
    <View style={[StyleSheet.absoluteFillObject]}>
      <Pressable
        onPress={enterFullscreen}
        style={{ flex: 1 }}
        accessibilityLabel="Video"
        accessibilityHint="Enters full screen"
        accessibilityRole="button"
      />

      <ControlButton
        onPress={togglePlayback}
        label={isPlaying ? "Pause" : "Play"}
        accessibilityHint="Plays or pauses the video"
        style={{ left: 6 }}
      >
        {isPlaying ? (
          <Ionicons name="pause" size={13} color="white" />
        ) : (
          <Ionicons name="play" size={13} color="white" />
        )}
      </ControlButton>

      {showTime && <TimeIndicator time={timeRemaining} style={{ left: 33 }} />}

      <ControlButton
        onPress={toggleMuted}
        label={isMuted ? "Unmute" : "Mute"}
        accessibilityHint="Toggles the sound"
        style={{ right: 6 }}
      >
        {isMuted ? (
          <Ionicons name="volume-mute" size={13} color="white" />
        ) : (
          <Ionicons name="volume-high" size={13} color="white" />
        )}
      </ControlButton>
    </View>
  );
}

const SimplifiedVideoPlayback: React.FC<SimplifiedVideoPlaybackProps> = ({
  src,
  shouldPlay,
  showPlayButton = false,
  onVideoPress,
  loop = false,
  isLive = false,
  thumbnail,
  aspectRatio,
}) => {
  const { isMuted, setGlobalMute } = useGlobalMute();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const videoRef = useRef<BlueskyVideoView>(null);
  const isFocused = useIsFocused();
  const [status, setStatus] = useState<"playing" | "paused" | "pending">(
    "pending"
  );

  // Calculate video aspect ratio - default to 16:9 if not provided
  const videoAspectRatio =
    aspectRatio ||
    (videoDimensions ? videoDimensions.width / videoDimensions.height : 16 / 9);

  // For portrait view, we want to ensure height > width (aspectRatio < 1)
  // If not already portrait, constrain to 3:4 portrait ratio
  const portraitRatio = videoAspectRatio < 1 ? videoAspectRatio : 3 / 4;

  // Determine when to show the overlay
  const showOverlay =
    !isActive ||
    isLoading ||
    (status === "paused" && !isActive) ||
    status === "pending";

  const handleMute = () => {
    console.log("Mute button pressed");
    if (videoRef.current) {
      videoRef.current.toggleMuted();
    }
  };

  const handlePress = () => {
    console.log("Entering fullscreen");
    if (videoRef.current) {
      videoRef.current.enterFullscreen(true);
    }
  };

  const togglePlayback = () => {
    console.log("Toggle playback pressed");
    if (videoRef.current) {
      videoRef.current.togglePlayback();
    }
  };

  const renderDevInfo = isDev && (
    <View style={styles.devInfo}>
      <Text style={styles.devInfoText}>
        {isPlaying ? "Playing" : "Paused"} - {currentTime.toFixed(2)}s /{" "}
        {duration.toFixed(2)}s - Focused: {isFocused ? "Yes" : "No"}
      </Text>
    </View>
  );

  // For large videos, use the portrait-friendly constrained layout
  return (
    <ConstrainedVideo aspectRatio={portraitRatio}>
      <BlueskyVideoView
        url={convertToCDNUrl(src)}
        autoplay={true}
        beginMuted={isMuted}
        style={styles.videoView}
        onActiveChange={(e) => {
          setIsActive(e.nativeEvent.isActive);
          if (!e.nativeEvent.isActive && status !== "pending") {
            setStatus("pending");
          }
        }}
        onLoadingChange={(e) => {
          setIsLoading(e.nativeEvent.isLoading);
        }}
        onMutedChange={(e) => {
          setGlobalMute(e.nativeEvent.isMuted);
        }}
        onStatusChange={(e) => {
          setIsPlaying(e.nativeEvent.status === "playing");
          setStatus(e.nativeEvent.status === "playing" ? "playing" : "paused");
        }}
        onTimeRemainingChange={(e) => {
          setTimeRemaining(e.nativeEvent.timeRemaining);
        }}
        ref={videoRef}
        accessibilityLabel="Video"
        accessibilityHint=""
      />

      {/* Show thumbnail/loading overlay when video is not ready */}
      {showOverlay && (
        <View
          style={[
            styles.thumbnailBackground,
            {
              backgroundColor: thumbnail ? undefined : "rgba(0,0,0,0.1)",
            },
          ]}
        >
          {thumbnail && (
            <Image
              source={{ uri: thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}

          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
        </View>
      )}

      {/* Video controls overlay */}
      <VideoControls
        enterFullscreen={handlePress}
        toggleMuted={handleMute}
        togglePlayback={togglePlayback}
        timeRemaining={timeRemaining}
        isPlaying={isPlaying}
        isMuted={isMuted}
      />

      {/* Live indicator */}
      {isLive && (
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {renderDevInfo}
    </ConstrainedVideo>
  );
};

const styles = StyleSheet.create({
  videoView: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  devInfo: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    zIndex: 1000,
    height: 30,
  },
  devInfoText: {
    color: "white",
  },
  liveIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 50,
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  liveText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  thumbnailBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  loaderContainer: {
    position: "absolute",
    borderRadius: 9999,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SimplifiedVideoPlayback;
