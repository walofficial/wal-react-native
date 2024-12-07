import { Match } from "@/interfaces";
import { atom } from "jotai";

export const matchState = atom<Match>(null);

// used to on what users we got 'You got match' notification, so that we don't need show it multiple times, if one user accepted in the background
export const savedMatchedUserIdsState = atom<string>([]);
