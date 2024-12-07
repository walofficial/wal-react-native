import { atom } from "jotai";

export const verificationStatusState = atom<{
  status: string;
  text: string;
  percentage?: number;
} | null>(null);
