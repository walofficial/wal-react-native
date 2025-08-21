import { useRef, useState, useEffect } from "react";
import { StyleSheet, Animated } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { isIOS } from "@/lib/platform";

interface VideoPlayerProps {
  videoUri: string;
  style?: any;
}

export default function VideoPlayer({ videoUri, style }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>(
    {} as AVPlaybackStatus
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const videoSrc = isIOS ? videoUri.replace(".mpd", ".m3u8") : videoUri;

  const startFadeIn = () => {
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000, // 1 second fade in
        useNativeDriver: true,
      }).start();
    }, 500); // Start fade in after 500ms delay
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(() => status);

    // Start fade in when video starts playing
    if (status.isLoaded && !status.isBuffering && status.isPlaying) {
      startFadeIn();
    }
  };

  return (
    <Animated.View
      style={[styles.videoContainer, style, { opacity: fadeAnim }]}
    >
      <Video
        ref={videoRef}
        source={{ uri: videoSrc }}
        shouldPlay={true}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        isLooping
        style={styles.videoView}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
