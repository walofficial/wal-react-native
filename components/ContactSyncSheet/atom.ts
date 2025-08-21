import { atom } from "jotai";
import { User } from "@/lib/api/generated";

export const displayedContactsAtom = atom<User[]>([]);
export const checkedCountAtom = atom(0);
