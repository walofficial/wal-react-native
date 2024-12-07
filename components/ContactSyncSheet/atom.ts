import { atom } from "jotai";
import { User } from "@/lib/interfaces";

export const displayedContactsAtom = atom<User[]>([]);
export const checkedCountAtom = atom(0);
