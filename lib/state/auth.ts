import { Task } from "react-native";
import { User } from "../interfaces";
import { atom } from "jotai";

export const authUser = atom<User>(null);
export const authError = atom<string | null>(null);

export const authInitializeTracker = atom<boolean>(false);

export const authenticatingState = atom<boolean>(false);

export const hasAccessState = atom<boolean>(false);

export const selectedTaskState = atom<Task | null>(null);

export const publicKeyState = atom<string>("");
