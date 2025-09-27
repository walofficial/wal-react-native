import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { ka } from 'date-fns/locale';
import { useSubscribeToSpace } from './useSubscribeToSpace';
import { useStartStream } from './useStartStream';
import { Headphones } from 'lucide-react-native';
import { FontSizes } from '@/lib/theme';
import { getRoomPreviewDataOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { getCurrentLocale } from '@/lib/i18n';

interface SpaceViewProps {
  roomName: string;
  isHost: boolean;
  scheduledAt?: string;
  description: string;
}

function SpaceView({ roomName, scheduledAt, description }: SpaceViewProps) {
  const [secondsLeftToStart, setSecondsLeftToStart] = useState<number>(0);
  const { subscribeToSpace } = useSubscribeToSpace();
  const { startStream, isPending: isStartingStream } = useStartStream();
  console.log('roomName', roomName);
  const roomPreview = useQuery({
    ...getRoomPreviewDataOptions({
      path: {
        livekit_room_name: roomName,
      },
    }),
    placeholderData: {
      number_of_participants: 0,
      description: '',
      is_subscribed: false,
      exists: false,
      space_state: 'pending' as const,
    },
  });

  useEffect(() => {
    if (!scheduledAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const scheduledDate = parseISO(scheduledAt);
      const diff = differenceInSeconds(scheduledDate, now);
      setSecondsLeftToStart(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  const isTimeToStart = !scheduledAt || secondsLeftToStart <= 0;
  const locale = getCurrentLocale();

  const formattedScheduledTime = scheduledAt
    ? formatDistanceToNow(parseISO(scheduledAt), {
        addSuffix: true,
        locale: locale === 'ka' ? ka : undefined,
      })
    : '';

  const SpaceContainer = ({ children }: { children: React.ReactNode }) => {
    const { exists, space_state } = roomPreview.data as {
      exists: boolean;
      space_state: string;
    };
    const isSpaceReadyToStream = exists && space_state === 'ready_to_start';
    const notStartedYet = space_state === 'ready_to_start' && !exists;

    return (
      <View
        style={[
          styles.container,
          notStartedYet || isSpaceReadyToStream
            ? styles.readyContainer
            : styles.defaultContainer,
          notStartedYet || isSpaceReadyToStream ? styles.blueShadow : {},
        ]}
      >
        {children}
      </View>
    );
  };

  const { number_of_participants, exists, space_state } = roomPreview.data as {
    number_of_participants: number;
    exists: boolean;
    space_state: string;
  };

  const isSpaceEnded = !exists && space_state === 'ended';
  const isSpaceReadyToStream = exists && space_state === 'ready_to_start';
  const isSpaceInfoLoading =
    space_state === 'pending' && roomPreview.isFetching;
  const notStartedYet = space_state === 'ready_to_start' && !exists;

  if (!scheduledAt || isTimeToStart) {
    return (
      <SpaceContainer>
        <View>
          <Text numberOfLines={2} style={styles.descriptionText}>
            {description}
          </Text>

          <View style={styles.statusContainer}>
            {notStartedYet && (
              <View style={styles.statusRow}>
                <Text style={styles.yellowText}>არ დაწყებულა</Text>
              </View>
            )}
            {isSpaceReadyToStream && (
              <View style={styles.statusRow}>
                <Text style={styles.redText}>პირდაპირი</Text>
              </View>
            )}
            {isSpaceInfoLoading && (
              <View style={styles.statusRow}>
                <Text style={styles.grayText}>იტვირთება...</Text>
              </View>
            )}
            {isSpaceEnded && (
              <View style={styles.statusRow}>
                <Text style={styles.grayText}>სტრიმი დასრულებულია</Text>
              </View>
            )}
            {(number_of_participants && number_of_participants > 0) ||
              (space_state === 'started' && (
                <View style={styles.listenersContainer}>
                  <View style={styles.dot} />
                  <Text style={styles.grayText}>
                    {number_of_participants} მსმენელი
                  </Text>
                </View>
              ))}
          </View>
        </View>

        <TouchableOpacity
          disabled={isStartingStream || isSpaceInfoLoading || isSpaceEnded}
          onPress={() => startStream(roomName)}
          style={[
            styles.listenButton,
            (isStartingStream || isSpaceEnded) && styles.disabledButton,
          ]}
        >
          <View style={styles.buttonContent}>
            {isStartingStream ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Headphones size={20} color="#000" />
                <Text style={styles.buttonText}>მოსმენა</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </SpaceContainer>
    );
  }

  // Scheduled space view
  return (
    <SpaceContainer>
      <Text style={styles.scheduledDescription}>{description}</Text>
      <TouchableOpacity
        disabled={space_state === 'ended'}
        onPress={() => subscribeToSpace(roomName)}
        style={[
          styles.listenButton,
          (roomPreview.data?.is_subscribed as boolean ||
            (!exists && space_state === 'ended')) &&
            styles.disabledButton,
        ]}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {roomPreview.data?.is_subscribed as boolean
              ? `დაიწყება ${formattedScheduledTime}`
              : 'დაიწყება'}
          </Text>
        </View>
      </TouchableOpacity>
    </SpaceContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginVertical: 12,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  readyContainer: {
    backgroundColor: '#1f2937',
  },
  defaultContainer: {
    backgroundColor: '#111827',
  },
  blueShadow: {
    shadowColor: '#3b82f6',
  },
  descriptionText: {
    color: 'white',
    fontSize: FontSizes.medium,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  yellowText: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  redText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  grayText: {
    color: '#d1d5db',
    fontWeight: '500',
  },
  listenersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    marginRight: 8,
  },
  listenButton: {
    backgroundColor: '#efefef',
    borderRadius: 9999,
    padding: 16,
    margin: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'black',
    marginLeft: 8,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  scheduledDescription: {
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});

export default SpaceView;
