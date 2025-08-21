import { atom } from "jotai";

export const isCommentSheetOpenAtom = atom(false);
export const activeCommentPostIdAtom = atom<string | null>(null);
export const activeTabAtom = atom<string>("recent");
export const shouldFocusCommentInputAtom = atom<boolean>(false);
