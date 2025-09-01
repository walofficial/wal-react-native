// @ts-nocheck
import {
  useConnectionState,
  useIOSAudioManagement,
  useIsSpeaking,
  useParticipantInfo,
  useParticipants,
  useRoomContext,
} from '@livekit/react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageLoader from '../ImageLoader';
import { useLocalParticipant } from '@livekit/react-native';
import { convertToCDNUrl } from '@/lib/utils';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRemoveFromStage } from './useRemoveFromStage';
import { useInviteToStage } from './useInviteToStage';
import { useAtomValue } from 'jotai';
import { activeLivekitRoomState, participantSearchState } from './atom';
import { Avatar } from '../ui/avatar';
import WaveAudio from './WaveAudio';
import SpaceViewParticipant from './SpaceViewParticipant';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useHaptics } from '@/lib/haptics';
import { FontSizes } from '@/lib/theme';
import { t } from '@/lib/i18n';

export default function PresenceDialog({
  isHost = false,
}: {
  isHost?: boolean;
}) {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const participantSearch = useAtomValue(participantSearchState);

  const room = useRoomContext();
  useIOSAudioManagement(room);

  const hosts = participants.filter(
    (participant) => participant.permissions?.canPublish ?? false,
  );

  const viewers = participants.filter(
    (participant) => !participant.permissions?.canPublish ?? true,
  );

  const filteredViewers = viewers
    .map((participant) => {
      const metadata = JSON.parse(participant.metadata || '{}');
      const username = metadata.username || '';
      const handRaised = metadata.hand_raised || false;
      const matchScore = username
        .toLowerCase()
        .includes(participantSearch.toLowerCase())
        ? 1
        : 0;
      return { participant, matchScore, handRaised };
    })
    .filter(({ matchScore }) => !participantSearch || matchScore > 0)
    .sort((a, b) => {
      if (a.handRaised && !b.handRaised) return -1;
      if (!a.handRaised && b.handRaised) return 1;
      return b.matchScore - a.matchScore;
    })
    .map(({ participant }) => participant)
    .slice(0, 50);

  if (connectionState !== 'connected') {
    return <View style={styles.container}></View>;
  }
  return (
    <GestureHandlerRootView style={styles.container}>
      <SpaceViewParticipant />
      <View style={styles.contentContainer}>
        <BottomSheetScrollView>
          {hosts.length > 0 && !participantSearch && (
            <View style={styles.hostsContainer}>
              <View style={styles.participantsGrid}>
                {hosts.map((participant) => (
                  <View
                    key={participant.identity}
                    style={styles.participantCell}
                  >
                    <ParticipantListItem
                      participant={participant}
                      metadata={JSON.parse(participant.metadata || '{}')}
                      isCurrentUser={
                        participant.identity === localParticipant.identity
                      }
                      isSpeaker={true}
                      isHost={isHost}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {filteredViewers.length > 0 && (
            <View>
              <View style={styles.participantsGrid}>
                {filteredViewers.map((participant) => (
                  <View
                    key={participant.identity}
                    style={styles.participantCell}
                  >
                    <ParticipantListItem
                      participant={participant}
                      metadata={JSON.parse(participant.metadata || '{}')}
                      isCurrentUser={
                        participant.identity === localParticipant.identity
                      }
                      isSpeaker={false}
                      isHost={isHost}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

function ParticipantListItem({
  participant,
  metadata,
  isCurrentUser,
  isSpeaker,
  isHost,
}: {
  participant: any;
  metadata: {
    avatar_image: string;
    username: string;
    is_host: boolean;
    hand_raised: boolean;
    invited_to_stage: boolean;
  };
  isCurrentUser: boolean;
  isSpeaker: boolean;
  isHost: boolean;
}) {
  const imageUrl = metadata?.avatar_image;
  const { removeFromStage } = useRemoveFromStage();
  const { inviteToStage } = useInviteToStage();
  const liveKitRoom = useAtomValue(activeLivekitRoomState);
  const isSpeaking = useIsSpeaking(participant);
  const haptic = useHaptics();
  const handlePress = async () => {
    if (!isHost || isCurrentUser) return;

    haptic('Medium');

    if (metadata.invited_to_stage && metadata.hand_raised) {
      Alert.alert(
        'სცენიდან წაშლა',
        `გსურთ ${metadata.username}-ის სცენიდან წაშლა?`,
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete'),
            onPress: async () => {
              haptic('Medium');
              removeFromStage({
                livekit_room_name: liveKitRoom?.livekit_room_name || '',
                participant_identity: participant.identity,
              });
            },
          },
        ],
      );
    } else {
      Alert.alert('მოწვევა', `გსურთ ${metadata.username}-ის სცენაზე მოწვევა?`, [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.invite'),
          onPress: async () => {
            haptic('Medium');
            inviteToStage({
              livekit_room_name: liveKitRoom?.livekit_room_name || '',
              participant_identity: participant.identity,
            });
          },
        },
      ]);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.participantContainer}>
        <View style={styles.avatarContainer}>
          <Avatar style={styles.avatar} alt="Avatar">
            <View style={styles.avatarContent}>
              {imageUrl ? (
                <ImageLoader
                  style={styles.avatarImage}
                  source={{ uri: convertToCDNUrl(imageUrl) }}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {metadata?.username?.[0] || 'N/A'}
                </Text>
              )}
            </View>
          </Avatar>

          {metadata.hand_raised && !metadata.invited_to_stage && (
            <View style={styles.handRaisedIcon}>
              <Ionicons name="hand-left" size={24} color="#FFBE00" />
            </View>
          )}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          {metadata?.username}
        </Text>
        {isSpeaking ? (
          <WaveAudio />
        ) : (
          <Text style={styles.roleText} numberOfLines={1}>
            {isSpeaker ? 'წამყვანი' : 'მსმენელი'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hostsContainer: {
    marginBottom: 24,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantCell: {
    width: '22%',
  },
  participantContainer: {
    marginBottom: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
  },
  avatarContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarImage: {
    borderRadius: 100,
  },
  avatarText: {
    color: 'white',
    fontSize: FontSizes.medium,
  },
  handRaisedIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'black',
    borderRadius: 100,
    padding: 4,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    overflow: 'hidden',
    textAlign: 'center',
    marginTop: 4,
  },
  roleText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
