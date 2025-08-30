import * as React from 'react';
import { Image, View, ViewStyle, StyleSheet, Text } from 'react-native';
import {
  isTrackReference,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useIsMuted,
  useIsSpeaking,
  useParticipantInfo,
  VideoTrack,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

interface ParticipantViewProps {
  trackRef: TrackReferenceOrPlaceholder;
  style?: ViewStyle;
  zOrder?: number;
  mirror?: boolean;
}

export const ParticipantView = ({
  style = {},
  trackRef,
  zOrder,
  mirror,
}: ParticipantViewProps) => {
  const trackReference = useEnsureTrackRef(trackRef);
  const { identity, name } = useParticipantInfo({
    participant: trackReference.participant,
  });
  const isSpeaking = useIsSpeaking(trackRef.participant);
  const isVideoMuted = useIsMuted(trackRef);

  let videoView;
  if (isTrackReference(trackRef) && !isVideoMuted) {
    videoView = (
      <VideoTrack trackRef={trackRef} zOrder={zOrder} mirror={mirror} />
    );
  } else {
    videoView = (
      <View style={styles.placeholderContainer}>
        <View style={styles.flex} />
        <Image style={styles.placeholderImage} />
        <View style={styles.flex} />
      </View>
    );
  }

  let displayName = name ? name : identity;
  if (trackRef.source === Track.Source.ScreenShare) {
    displayName = `${displayName}'s screen`;
  }

  return (
    <View style={[styles.container, style]}>
      {videoView}
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>{displayName}</Text>
      </View>
      {isSpeaking && <View style={styles.speakingBorder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00153C',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImage: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  nameText: {
    color: 'white',
  },
  speakingBorder: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: '#007DFF',
  },
});
