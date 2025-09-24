import { atom } from 'jotai';

export const isCommentSheetOpenAtom = atom(false);
export const activeCommentPostIdAtom = atom<string | null>(null);
export const activeTabAtom = atom<'recent' | 'top'>('recent');
export const shouldFocusCommentInputAtom = atom<boolean>(false);
