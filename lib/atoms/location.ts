import { atom } from "jotai";

export const locationUserListSheetState = atom<boolean>(false);
export const locationUserListfeedIdState = atom<string | null>(null);
export const scrollToTopState = atom<number>(0); // Use timestamp to trigger scrolling 