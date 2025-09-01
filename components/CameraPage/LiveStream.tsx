import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  VideoTrack,
  registerGlobals,
  useTracks,
  useRoom,
  useRoomContext,
} from '@livekit/react-native';
import { Track, LocalVideoTrack } from 'livekit-client';
import { RoomControls } from './RoomControls';
// @ts-ignore
import { mediaDevices } from '@livekit/react-native-webrtc';
import useAuth from '@/hooks/useAuth';
import { BlurView } from 'expo-blur';
import { t } from '@/lib/i18n';

registerGlobals();

interface LiveStreamProps {
  token: string;
  roomName: string;
  onDisconnect?: () => void;
}

export function LiveStream({ token, roomName, onDisconnect }: LiveStreamProps) {
  const handleDisconnect = useCallback(() => {
    // Ensure cleanup happens before calling the parent's onDisconnect
    if (onDisconnect) {
      onDisconnect();
    }
  }, [onDisconnect]);

  return (
    <LiveKitRoom
      serverUrl={'wss://ment-6gg5tj49.livekit.cloud'}
      token={token}
      onError={(error: Error) => {
        // toast(error.message);
      }}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={true}
      onDisconnected={handleDisconnect}
    >
      <View style={styles.container}>
        <RoomView onDisconnect={handleDisconnect} />
      </View>
    </LiveKitRoom>
  );
}

interface RoomViewProps {
  onDisconnect?: () => void;
}

function RoomView({ onDisconnect }: RoomViewProps) {
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isCameraFrontFacing, setCameraFrontFacing] = useState(true);
  const room = useRoomContext();
  const { user } = useAuth();

  // Get all camera tracks.
  const tracks = useTracks([Track.Source.Camera]);
  const cameraTrack = localParticipant?.getTrackPublication(
    Track.Source.Camera,
  );

  // Handle disconnection with complete reset
  const handleDisconnect = useCallback(() => {
    // Disable camera and microphone
    if (localParticipant) {
      localParticipant.setCameraEnabled(false);
      localParticipant.setMicrophoneEnabled(false);
    }

    // Reset all state
    setIsMicEnabled(true);
    setIsCameraEnabled(true);
    setCameraFrontFacing(true);

    // Call parent's onDisconnect
    if (onDisconnect) {
      onDisconnect();
    }
  }, [localParticipant, onDisconnect]);

  // Listen for track mute/unmute events
  useEffect(() => {
    if (!localParticipant) return;

    const handleTrackMuted = (pub: any) => {
      if (pub.source === Track.Source.Camera) {
        setIsCameraEnabled(false);
      } else if (pub.source === Track.Source.Microphone) {
        setIsMicEnabled(false);
      }
    };

    const handleTrackUnmuted = (pub: any) => {
      if (pub.source === Track.Source.Camera) {
        setIsCameraEnabled(true);
      } else if (pub.source === Track.Source.Microphone) {
        setIsMicEnabled(true);
      }
    };

    localParticipant.on('trackMuted', handleTrackMuted);
    localParticipant.on('trackUnmuted', handleTrackUnmuted);

    return () => {
      localParticipant.off('trackMuted', handleTrackMuted);
      localParticipant.off('trackUnmuted', handleTrackUnmuted);
    };
  }, [localParticipant]);

  // Setup views.
  const stageView = (
    <VideoTrack trackRef={tracks[0]} style={styles.videoTrack} />
  );

  // Profile view when camera is disabled
  const profileView = (
    <View style={styles.disabledCameraContainer}>
      <BlurView intensity={15} tint="dark" style={styles.blurBackground}>
        {/* {user && <ProfileView userId={user.id} />} */}
        <View style={styles.messageContainer}>
          <Text style={styles.disabledMessage}>
            {t('common.video_disabled')}
          </Text>
          <Text style={styles.disabledSubMessage}>
            {t('common.enable_video_to_be_seen')}
          </Text>
        </View>
      </BlurView>
    </View>
  );

  useEffect(() => {
    const startAudioSession = async () => {
      await AudioSession.startAudioSession();
    };
    startAudioSession();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setCameraEnabled(true);
      localParticipant.setMicrophoneEnabled(true);
      setIsCameraEnabled(true);
      setIsMicEnabled(true);
    }
  }, [localParticipant]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Ensure tracks are disabled on unmount
      if (localParticipant) {
        localParticipant.setCameraEnabled(false);
        localParticipant.setMicrophoneEnabled(false);
      }
    };
  }, [localParticipant]);

  // Add camera switch handler
  const handleCameraSwitch = async () => {
    if (!cameraTrack) {
      return;
    }

    let facingModeStr = !isCameraFrontFacing ? 'front' : 'environment';
    setCameraFrontFacing(!isCameraFrontFacing);
    let devices = await mediaDevices.enumerateDevices();
    var newDevice;
    //@ts-ignore
    for (const device of devices) {
      //@ts-ignore
      if (device.kind === 'videoinput' && device.facing === facingModeStr) {
        newDevice = device;
        break;
      }
    }

    if (!newDevice) {
      return;
    }

    const localCameraTrack = cameraTrack.videoTrack;
    if (localCameraTrack instanceof LocalVideoTrack) {
      localCameraTrack.restartTrack({
        deviceId: newDevice.deviceId,
        facingMode: facingModeStr as
          | 'environment'
          | 'user'
          | 'left'
          | 'right'
          | undefined,
      });
    }
  };

  return (
    <View style={styles.container}>
      {isCameraEnabled ? stageView : profileView}
      <RoomControls
        micEnabled={isMicEnabled}
        setMicEnabled={(enabled: boolean) => {
          setIsMicEnabled(enabled);
          localParticipant?.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={isCameraEnabled}
        setCameraEnabled={(enabled: boolean) => {
          setIsCameraEnabled(enabled);
          localParticipant?.setCameraEnabled(enabled);
        }}
        onDisconnectClick={handleDisconnect}
        onSwitchCamera={handleCameraSwitch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  videoTrack: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  disabledCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  disabledMessage: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  disabledSubMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
});
