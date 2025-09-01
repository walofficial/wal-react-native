import { atom } from 'jotai';

export const lastSavedRecordingTimeState = atom<number>(0);

export const isContactSyncSheetOpenState = atom<boolean>(false);
