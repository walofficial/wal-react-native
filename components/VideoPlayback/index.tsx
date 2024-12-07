import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Button } from "../ui/button";
import { Play } from "@/lib/icons";
import TaskBottomOverlay from "../TaskBottomOverlay";
import FullOverlayBlack from "../FullOverlayBack";
import MuteButton from "../MuteButton";
import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { convertToCDNUrl } from "@/lib/utils";
import { useVideoError } from "@/hooks/useVideoError";
import { isDev } from "@/lib/api/config";
import { useAtomValue } from "jotai";
import { dimensionsState } from "../ActualDimensionsProvider";
import TopGradient from "./TopGradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useGlobalMute } from "@/hooks/useGlobalMute";

const VideoPlayback = ({
  isFullscreen = true,
  isBigPlayAlwaysHidden,
  src,
  topControls,
  bottomControls,
  muted: initialMuted,
  hideTopControls,
  heightOffset = 0,
  withBigPlay,
  autoplay,
  cover,
  loop,
  shouldPlay,
}: {
  heightOffset?: number;
  useDimensionsHeight?: boolean;
  isFullscreen?: boolean;
  isBigPlayAlwaysHidden?: boolean;
  topControls?: React.ReactNode;
  bottomControls?: React.ReactNode;
  sources?: string[];
  src: string;
  muted?: boolean;
  loop?: boolean;
  hideTopControls?: boolean;
  withBigPlay?: boolean;
  autoplay?: boolean;
  cover?: boolean;
  poster?: string;
  preload?: boolean;
  shouldPlay?: boolean;
}) => {
  const videoRef = useRef(null);
  const [showBigPlayButton, setShowBigPlayButton] = useState(false);
  const { isMuted, setGlobalMute } = useGlobalMute();
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isFocused = useIsFocused();
  const { width: actualWidth, height: actualHeight } = useAtomValue(
    dimensionsState
  ) ?? { width: 0, height: 0 };

  const player = useVideoPlayer(convertToCDNUrl(src), (player) => {
    player.loop = !!loop;
    player.muted = !!initialMuted;
    if (autoplay || shouldPlay) {
      player.play();
    }
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (isFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isFocused]);

  useEffect(() => {
    const statusSubscription = player.addListener("statusChange", (status) => {
      if (status === "loading") {
        setIsLoading(true);
        setIsBuffering(true);
      } else if (status === "readyToPlay") {
        setIsLoading(false);
        setIsBuffering(false);
      }
    });

    const playingSubscription = player.addListener(
      "playingChange",
      (isPlaying) => {
        setIsPlaying(isPlaying);

        if (isPlaying) {
          setShowBigPlayButton(false);
        }
      }
    );

    const volumeSubscription = player.addListener("volumeChange", (status) => {
      // setGlobalMute(status.isMuted);
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      volumeSubscription.remove();
    };
  }, [withBigPlay, isBigPlayAlwaysHidden]);

  const handlePlayClick = useCallback(async () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying]);

  const handleMute = async () => {
    const newMutedState = !isMuted;
    setGlobalMute(newMutedState);
  };

  const [errorMessage, setErrorMessage] = useVideoError(null); // We'll need to adapt error handling

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    if (typeof setErrorMessage === "function") {
      setErrorMessage(null);
    }
    if (autoplay) {
      player.play();
    }
  }, [src, autoplay]);

  const containerStyle = useMemo(
    () => ({
      width: isFullscreen ? actualWidth : "100%",
      height: isFullscreen ? actualHeight - heightOffset : "100%",
    }),
    [isFullscreen, actualWidth, actualHeight]
  ) as { width: number | string; height: number | string };

  const renderTopControls = useMemo(
    () => !hideTopControls && <TopGradient topControls={topControls} />,
    [hideTopControls, topControls]
  );

  const renderBottomControls = useMemo(
    () => (
      <BottomControls
        withBigPlay={!!withBigPlay}
        isLoading={isLoading}
        bottomControls={bottomControls}
      />
    ),
    [withBigPlay, isLoading, bottomControls]
  );

  const renderErrorMessage = useMemo(
    () =>
      errorMessage && (
        <>
          <FullOverlayBlack />
          <View className="left-0 px-4 right-0 text-center absolute bottom-0 top-0 m-auto items-center flex flex-col justify-center w-full h-full z-30">
            <Text className="text-white text-center mb-4">
              ხარვეზის ვიდეოს ჩატვირთვისას
            </Text>
            <Button onPress={handleRetry}>
              <Text>თავიდან</Text>
            </Button>
          </View>
        </>
      ),
    [errorMessage, handleRetry]
  );

  const renderLoadingIndicator = useMemo(
    () =>
      (isLoading || isBuffering) &&
      withBigPlay &&
      !errorMessage && (
        <View
          style={{
            zIndex: 40,
          }}
          className="absolute flex-1 h-full top-0 bottom-0 w-full flex items-center justify-center"
        >
          <ActivityIndicator color="white" size="large" />
        </View>
      ),
    [isLoading, isBuffering, withBigPlay, errorMessage]
  );

  const renderBigPlayButton = useMemo(
    () =>
      showBigPlayButton &&
      !errorMessage &&
      !isLoading &&
      !isBuffering &&
      !isBigPlayAlwaysHidden && (
        <Pressable
          onPress={handlePlayClick}
          style={{
            zIndex: 70,
          }}
          className="absolute flex-1 h-full top-0 bottom-0 w-full flex items-center justify-center"
        >
          <Button
            className="z-10 rounded-full"
            variant={"default"}
            size="icon"
            onPress={handlePlayClick}
            style={{
              width: 70,
              height: 70,
            }}
          >
            <Play size={40} fill={"gray"} color="gray" />
          </Button>
        </Pressable>
      ),
    [
      showBigPlayButton,
      errorMessage,
      isLoading,
      isBuffering,
      isBigPlayAlwaysHidden,
      handlePlayClick,
    ]
  );

  const renderMuteButton = useMemo(
    () =>
      withBigPlay &&
      !isLoading &&
      !isBuffering && (
        <MuteButton
          iconColor="white"
          muted={!!isMuted}
          style={{
            zIndex: 70,
          }}
          className="absolute bg-black/50 rounded-full right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-1000"
          onChange={handleMute}
        />
      ),
    [withBigPlay, isLoading, isBuffering, isMuted, handleMute]
  );

  // const renderDevInfo = useMemo(
  //   () =>
  //     isDev && (
  //       <View
  //         style={{
  //           position: "absolute",
  //           top: 20,
  //           left: 20,
  //           backgroundColor: "rgba(0,0,0,0.5)",
  //           padding: 5,
  //           zIndex: 1000,
  //         }}
  //       >
  //         <Text style={{ color: "white" }}>
  //           {isPlaying ? "Playing" : "Paused"} - {currentTime.toFixed(2)}s /{" "}
  //           {duration.toFixed(2)}s - Focused: {isFocused ? "Yes" : "No"}
  //         </Text>
  //       </View>
  //     ),
  //   [isDev, isPlaying, currentTime, duration, isFocused]
  // );

  return (
    <View style={containerStyle as any}>
      {renderTopControls}
      {bottomControls && renderBottomControls}
      <Pressable
        onPress={handlePlayClick}
        className="flex-1 flex items-center flex-row justify-center"
      >
        {src ? (
          <VideoView
            ref={videoRef}
            style={{
              backgroundColor: "black",
              position: "relative",
              height: "100%",
              width: "100%",
            }}
            contentFit={cover ? "cover" : "contain"}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            allowsVideoFrameAnalysis={false}
          />
        ) : (
          <View className="flex-1 flex items-center justify-center">
            <Text className="text-white">No video source available</Text>
          </View>
        )}
      </Pressable>
      {renderErrorMessage}
      {src && renderLoadingIndicator}
      {src && renderBigPlayButton}
      {src && renderMuteButton}
      {/* {renderDevInfo} */}
    </View>
  );
};

const BottomControls = React.memo(
  ({
    withBigPlay,
    isLoading,
    bottomControls,
  }: {
    bottomControls: React.ReactNode;
    withBigPlay: boolean;
    isLoading: boolean;
  }) => {
    return (
      <View
        style={{
          zIndex: 100,
        }}
        className="absolute bottom-0 left-0 right-0"
      >
        {withBigPlay && !isLoading && (
          <TaskBottomOverlay>{bottomControls}</TaskBottomOverlay>
        )}
      </View>
    );
  }
);

export default VideoPlayback;
