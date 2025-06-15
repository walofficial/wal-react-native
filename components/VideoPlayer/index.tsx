import { useRef, useState } from "react";
import { StyleSheet } from "react-native";
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

  const videoSrc = isIOS ? videoUri.replace(".mpd", ".m3u8") : videoUri;

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (videoRef.current) {
  //       videoRef.current.togglePlayback();
  //     }
  //   }, 100);

  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <Video
      ref={videoRef}
      source={{ uri: videoSrc }}
      shouldPlay={true}
      isMuted={true}
      resizeMode={ResizeMode.COVER}
      isLooping
      style={[styles.videoView, style]}
      onPlaybackStatusUpdate={(status) => setStatus(() => status)}
    />
  );
}

const styles = StyleSheet.create({
  videoView: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
