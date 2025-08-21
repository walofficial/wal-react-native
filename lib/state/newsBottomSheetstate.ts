import { atom } from "jotai";
import { NewsItem } from "../interfaces";

export const activeSourcesState = atom<NewsItem["sources"] | null>(null);
export const newsBottomSheetState = atom<boolean>(false);
