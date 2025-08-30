import { atom } from 'jotai';

export const activeLivekitRoomState = atom<{
  livekit_room_name: string;
  livekit_token: string;
  is_host: boolean;
  verification_id: string;
} | null>(null);

export const openBottomSheetState = atom<boolean>(false);

export const participantSearchState = atom<string>('');
