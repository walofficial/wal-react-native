import { User } from "@/lib/interfaces";
import { atom } from "jotai";

export const hasMessageAtom = atom<boolean>(false);
export const messageAtom = atom<string>("");
export const selectedChatUserState = atom<User | null>(null);
export const isChatUserOnlineState = atom<boolean | "not-status">("not-status");

export const userChatSettingsOpenState = atom<boolean>(false);

export const verificationRefetchIntervalState = atom<number | undefined>(
  undefined
);

export const activeChatUserIdState = atom<string | null>(null);
