import { atom } from "jotai";
import {
  FactCheckingResult,
  AiVideoSummary,
  ExternalVideo,
} from "@/lib/api/generated";

interface Source {
  title: string;
  uri: string;
}

export const activeSourcesState = atom<Source[] | null>(null);
export const newsBottomSheetState = atom<boolean>(false);

export const factCheckBottomSheetState = atom<boolean>(false);
export const activeFactCheckData = atom<FactCheckingResult | null>(null);

export const aiSummaryBottomSheetState = atom<boolean>(false);

export const activeAIVideoSummary = atom<{
  aiSummary: AiVideoSummary;
  videoData: ExternalVideo;
} | null>(null);
