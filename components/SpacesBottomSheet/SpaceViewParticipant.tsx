import {
  AudioSession,
  useLocalParticipantPermissions,
} from '@livekit/react-native';
import { useEffect } from 'react';
import { useLocalParticipant } from '@livekit/react-native';
import { Platform, View, Text } from 'react-native';
import { useAtomValue } from 'jotai';
import { activeLivekitRoomState } from './atom';

export type RoomMetadata = {
  creator_identity: string;
  enable_chat: boolean;
  allow_participation: boolean;
};

export type ParticipantMetadata = {
  is_host: boolean;
  hand_raised: boolean;
  invited_to_stage: boolean;
  avatar_image: string;
};

function SpaceViewParticipant() {
  const { localParticipant } = useLocalParticipant();
  const localMetadata = (localParticipant.metadata &&
    JSON.parse(localParticipant.metadata)) as ParticipantMetadata;
  const liveKitRoom = useAtomValue(activeLivekitRoomState);

  const canHost =
    liveKitRoom?.is_host ||
    (localMetadata?.invited_to_stage && localMetadata?.hand_raised);

  return canHost ? (
    <>
      <SpaceViewSpeaker />
    </>
  ) : (
    <SpaceViewNonSpeaker />
  );
}

function SpaceViewSpeaker() {
  const { localParticipant } = useLocalParticipant();
  const permission = useLocalParticipantPermissions();

  useEffect(() => {
    const startAudioSession = async () => {
      await AudioSession.startAudioSession();
      if (Platform.OS === 'ios') {
        await AudioSession.selectAudioOutput('default');
      } else {
        await AudioSession.selectAudioOutput('speaker');
      }
    };
    startAudioSession();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, permission?.canPublish]);

  return <View></View>;
}

function SpaceViewNonSpeaker() {
  useEffect(() => {
    const startAudioSession = async () => {
      await AudioSession.startAudioSession();
      if (Platform.OS === 'ios') {
        await AudioSession.selectAudioOutput('default');
      } else {
        await AudioSession.selectAudioOutput('speaker');
      }
    };
    startAudioSession();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);
  return <View></View>;
}

export default SpaceViewParticipant;
