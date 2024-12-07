import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { isAppInBackgroundState } from "../lib/state/system";
import { useSetAtom } from "jotai";

const AppStateHandler: React.FC = () => {
  const appState = useRef(AppState.currentState);
  const setIsAppInBackground = useSetAtom(isAppInBackgroundState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        setIsAppInBackground(true);
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        setIsAppInBackground(false);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
};

export default AppStateHandler;
