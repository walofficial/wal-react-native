import { ContactDetails, Match, Task, TaskVerification } from "@/interfaces";
import { atom } from "jotai";

export const openedContactsState = atom<{
  targetUserName: string;
  contacts: ContactDetails;
} | null>(null);

export const openedTaskState = atom<Match | null>(null);

export const cameraStream = atom<MediaStream | null>(null);
export const activeMatchItem = atom<{
  matchId: string;
  taskVerifications: TaskVerification[];
} | null>(null);

export const promoButtonViewOpenState = atom<boolean>(false);

export const verifiedPhotoFetcherState = atom<{
  matchId: string;
  userId: string;
} | null>(null);

export const targetTextState = atom<string | null>(null);
