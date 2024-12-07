import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  TouchableHighlight,
  TouchableOpacity,
} from "react-native";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { convertToCDNUrl } from "@/lib/utils";
import { useVideoError } from "@/hooks/useVideoError";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import MuteButton from "../MuteButton";
import { useVideoPlayer, VideoView } from "expo-video";
import { useGlobalMute } from "@/hooks/useGlobalMute";

interface SimplifiedVideoPlaybackProps {
  src: string;
  shouldPlay: boolean;
  small?: boolean;
  showPlayButton?: boolean;
  onVideoPress?: (currentTime: number) => void;
  minHeight?: number;
  maxHeight?: number;
}

const SimplifiedVideoPlayback: React.FC<SimplifiedVideoPlaybackProps> = ({
  src,
  shouldPlay,
  small = false,
  showPlayButton = false,
  onVideoPress,
  minHeight = 300,
  maxHeight = 300,
}) => {
  const { isMuted, setGlobalMute } = useGlobalMute();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useVideoError(status);
  const ref = useRef(null);
  const isFocused = useIsFocused();

  const player = useVideoPlayer(convertToCDNUrl(src), (player) => {
    player.loop = !small;
    player.muted = small ? true : isMuted;
    if (small) {
      player.pause();
    }
  });

  useEffect(() => {
    player.muted = small ? true : isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (small) {
      return;
    }
    if (shouldPlay && isFocused) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [shouldPlay, isFocused, small]);

  const handleMute = async () => {
    const newMutedState = !isMuted;
    setGlobalMute(newMutedState);
  };

  const handlePress = useCallback(() => {
    if (onVideoPress) {
      setGlobalMute(false);
      player.muted = false;
      onVideoPress(player.currentTime);
    }
  }, [onVideoPress, player, setGlobalMute]);

  useEffect(() => {
    const subscription = player.addListener("volumeChange", (status) => {
      // setGlobalMute(status.isMuted);
    });

    const loadingSubscription = player.addListener("statusChange", (status) => {
      if (status === "loading") {
        setIsLoading(true);
      } else if (status === "readyToPlay") {
        setIsLoading(false);
      } else if (status === "error") {
        setIsLoading(false);
        setErrorMessage("Error loading video");
      } else if (status === "idle") {
        setIsPlaying(false);
      }
    });

    const playingChangeSubscription = player.addListener(
      "playingChange",
      (isPlaying) => {
        setIsPlaying(isPlaying);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.remove();
      loadingSubscription.remove();
      playingChangeSubscription.remove();
    };
  }, []);

  const renderContent = () => {
    if (errorMessage) {
      return (
        <View className="absolute inset-0 flex flex-row h-full w-full items-center justify-center bg-transparent bg-opacity-50">
          <Ionicons name="warning" size={24} color="yellow" />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="absolute inset-0 flex flex-row h-full w-full items-center justify-center bg-transparent bg-opacity-50">
          <ActivityIndicator color="white" />
        </View>
      );
    }

    return null;
  };

  const renderVideo = () => {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <VideoView
          contentFit={"cover"}
          ref={ref}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 10,
            overflow: "hidden",
          }}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          allowsVideoFrameAnalysis={false}
          removeClippedSubviews
        />
      </TouchableOpacity>
    );
  };

  if (small) {
    return (
      <View
        style={{ width: 120, height: 120 }}
        className="rounded-xl overflow-hidden relative bg-gray-800"
      >
        {renderContent()}
        {renderVideo()}
        {showPlayButton && (
          <View
            className="absolute inset-0 flex flex-row h-full w-full items-center justify-center bg-opacity-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={40}
              color="white"
            />
          </View>
        )}
      </View>
    );
  } else {
    return (
      <View
        style={{
          minHeight: minHeight,
          maxHeight: maxHeight,
        }}
        className="rounded-xl w-full  relative bg-gray-800"
      >
        {renderVideo()}
        {renderContent()}
        <MuteButton
          iconColor="white"
          muted={isMuted}
          className="absolute bg-black/50 rounded-full right-2 bottom-2"
          onChange={handleMute}
        />
      </View>
    );
  }
};

export default SimplifiedVideoPlayback;
