import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom, useAtom } from "jotai";

const MUTE_PREFERENCE_KEY = "@video_mute_preference";

export const globalMuteAtom = atom(false);

export const useGlobalMute = () => {
  const [isMuted, setIsMuted] = useAtom(globalMuteAtom);

  useEffect(() => {
    loadMutePreference();
  }, []);

  const loadMutePreference = async () => {
    try {
      const preference = await AsyncStorage.getItem(MUTE_PREFERENCE_KEY);
      setIsMuted(preference === "true");
    } catch (error) {
      console.error("Error loading mute preference:", error);
    }
  };

  const setGlobalMute = async (muted: boolean) => {
    try {
      await AsyncStorage.setItem(MUTE_PREFERENCE_KEY, String(muted));
      setIsMuted(muted);
    } catch (error) {
      console.error("Error saving mute preference:", error);
    }
  };

  return { isMuted, setGlobalMute };
};
