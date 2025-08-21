import { useToast } from "@/components/ToastUsage";
import {
  LiveKitRoom,
  useRemoteParticipants,
  VideoTrack,
  VideoView,
  useParticipantTracks,
  useConnectionState,
  AudioSession,
  setLogLevel,
  LogLevel,
} from "@livekit/react-native";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Dimensions,
  DimensionValue,
} from "react-native";
import useLiveStreamToken from "./useLiveStreamToken";
import { Track } from "livekit-client";
import { router } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import TopGradient from "../VideoPlayback/TopGradient";
import CloseButton from "../CloseButton";
import { FontSizes } from "@/lib/theme";
import { t } from "@/lib/i18n";

// Component for constraining video to portrait aspect ratio
function ConstrainedLiveVideo({ children }: { children: React.ReactNode }) {
  // Use 9:16 aspect ratio for portrait video (standard mobile video ratio)
  const aspectRatio = 9 / 16;

  return (
    <View style={styles.constrainedContainer}>
      <View
        style={{
          width: "100%",
          height: Dimensions.get("window").height * 0.8,
          maxWidth: Dimensions.get("window").width * 0.9,
          aspectRatio: 1 / aspectRatio, // Container will be taller than wide
          alignSelf: "center",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "black",
          position: "relative",
        }}
      >
        {children}
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}

function LiveStreamViewer({
  liveKitRoomName,
  topControls,
}: {
  liveKitRoomName: string;
  topControls: React.ReactNode;
}) {
  const { data, isLoading, error } = useLiveStreamToken(liveKitRoomName);
  const router = useRouter();
  const { error: errorToast } = useToast();
  if (isLoading) return <Text>{t("common.loading")}</Text>;
  if (error)
    return (
      <Text>
        {t("common.error_colon")} {error.message}
      </Text>
    );

  return (
    <LiveKitRoom
      serverUrl={"wss://ment-6gg5tj49.livekit.cloud"}
      token={data?.livekit_token}
      onError={(error: Error) => {
        toast(error.message);
      }}
      onConnected={() => {}}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: "screen" },
      }}
      onDisconnected={() => {
        errorToast({
          title: t("common.live_stream_disconnected"),
          description: t("common.live_stream_disconnected"),
        });
        router.back();
      }}
    >
      <RoomView topControls={topControls} />
    </LiveKitRoom>
  );
}

function RoomView({ topControls }: { topControls: React.ReactNode }) {
  const tracks = useParticipantTracks([Track.Source.Camera], "identity");
  const router = useRouter();
  const connectionState = useConnectionState();
  const { error: errorToast } = useToast();

  useEffect(() => {
    const startAudioSession = async () => {
      await AudioSession.startAudioSession();
      if (Platform.OS === "ios") {
        await AudioSession.selectAudioOutput("default");
      } else {
        await AudioSession.selectAudioOutput("speaker");
      }
    };
    startAudioSession();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  if (connectionState === "connected") {
    if (tracks.length === 0) {
      return (
        <ConstrainedLiveVideo>
          <View style={styles.noStreamContainer}>
            <Text style={styles.noStreamText}>
              {t("common.live_stream_unavailable")}
            </Text>
            <CloseButton variant="x" onClick={() => router.back()} />
          </View>
        </ConstrainedLiveVideo>
      );
    }

    return (
      <ConstrainedLiveVideo>
        <View style={styles.streamContainer}>
          <TopGradient topControls={topControls} />
          <VideoTrack style={styles.videoTrack} trackRef={tracks[0]} />
        </View>
      </ConstrainedLiveVideo>
    );
  }
  return (
    <ConstrainedLiveVideo>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#efefef" />
      </View>
    </ConstrainedLiveVideo>
  );
}

const styles = StyleSheet.create({
  constrainedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  noStreamContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    backgroundColor: "black",
  },
  noStreamText: {
    color: "white",
    fontSize: FontSizes.medium,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  streamContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    overflow: "hidden",
  },
  videoTrack: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  liveIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF0000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  liveText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default LiveStreamViewer;
