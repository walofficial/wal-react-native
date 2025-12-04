import { useRef, useState, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { isIOS } from '@/lib/platform';

interface VideoPlayerProps {
  videoUri: string;
  style?: any;
}

export default function VideoPlayer({ videoUri, style }: VideoPlayerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const videoSrc = isIOS ? videoUri.replace('.mpd', '.m3u8') : videoUri;

  const player = useVideoPlayer(videoSrc, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const startFadeIn = () => {
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000, // 1 second fade in
        useNativeDriver: true,
      }).start();
    }, 500); // Start fade in after 500ms delay
  };

  // Start fade in when video starts playing
  useEffect(() => {
    if (isPlaying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      startFadeIn();
    }
  }, [isPlaying, hasStartedPlaying]);

  return (
    <Animated.View
      style={[styles.videoContainer, style, { opacity: fadeAnim }]}
    >
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="cover"
        nativeControls={false}
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
