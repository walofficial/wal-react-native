import { useMutation } from '@tanstack/react-query';
import { raiseHandMutation } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useState, useEffect, useRef } from 'react';
import { useLocalParticipant, useParticipantInfo } from '@livekit/react-native';

export default function useRaiseHand() {
  const [isHandRaised, setIsHandRaised] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const { metadata } = useParticipantInfo({
    participant: localParticipant,
  });
  const localMetadata = JSON.parse(metadata ?? '{}') as {
    hand_raised: boolean;
  };

  useEffect(() => {
    if (!localMetadata?.hand_raised) {
      setIsHandRaised(false);
    }
  }, [localMetadata?.hand_raised]);

  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const { mutate: raiseHand, isPending } = useMutation({
    ...raiseHandMutation(),
    onMutate: async () => {
      setIsHandRaised(true);
    },
    onError: async () => {},
  });

  return {
    setIsHandRaised,
    isPending,
    raiseHand: (roomName: string) =>
      (raiseHand as any)({
        body: {
          livekit_room_name: roomName,
          user_id: localParticipant.identity,
        },
      }),
    isHandRaised,
  };
}
