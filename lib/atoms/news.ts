import { atom } from "jotai";
import {
  FactCheckResponse,
  AIVideoSummary,
  ExternalVideo,
} from "@/lib/interfaces";

interface Source {
  title: string;
  uri: string;
}

export const activeSourcesState = atom<Source[] | null>(null);
export const newsBottomSheetState = atom<boolean>(false);

export const factCheckBottomSheetState = atom<boolean>(false);
export const activeFactCheckData = atom<FactCheckResponse | null>(null);

export const aiSummaryBottomSheetState = atom<boolean>(false);

export const activeAIVideoSummary = atom<{
  aiSummary: AIVideoSummary;
  videoData: ExternalVideo;
} | null>(null);
