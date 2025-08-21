import React from "react";
import { nanoid } from "nanoid/non-secure";

import { useNonReactiveCallback } from "@/lib/hooks/useNonReactiveCallback";
import { ReactionType } from "@/lib/api/generated";

export type ReactionsOverlay = {
  id: string;
  isVisible: boolean;
  buttonPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
    screenWidth?: number;
  };
  currentUserReaction?: ReactionType;
  onReactionPress?: (reactionType: ReactionType) => void;
  onClose?: () => void;
};

const ReactionsOverlayContext = React.createContext<{
  activeOverlay: ReactionsOverlay | null;
}>({
  activeOverlay: null,
});

const ReactionsOverlayControlContext = React.createContext<{
  showOverlay: (config: {
    buttonPosition: { x: number; y: number; width: number; height: number };
    currentUserReaction?: ReactionType;
    onReactionPress: (reactionType: ReactionType) => void;
    onClose: () => void;
  }) => void;
  hideOverlay: () => void;
}>({
  showOverlay: () => {},
  hideOverlay: () => {},
});

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const [activeOverlay, setActiveOverlay] =
    React.useState<ReactionsOverlay | null>(null);

  const showOverlay = useNonReactiveCallback(
    (config: {
      buttonPosition: { x: number; y: number; width: number; height: number };
      currentUserReaction?: ReactionType;
      onReactionPress: (reactionType: ReactionType) => void;
      onClose: () => void;
    }) => {
      setActiveOverlay((prevOverlay) => {
        if (prevOverlay) {
          // If already open, update with new config
          return {
            ...prevOverlay,
            ...config,
          };
        } else {
          return {
            id: nanoid(),
            isVisible: true,
            ...config,
          };
        }
      });
    }
  );

  const hideOverlay = useNonReactiveCallback(() => {
    const currentOverlay = activeOverlay;
    setActiveOverlay(null);
    // Call the onClose callback if it exists
    if (currentOverlay?.onClose) {
      currentOverlay.onClose();
    }
  });

  const state = React.useMemo(
    () => ({
      activeOverlay,
    }),
    [activeOverlay]
  );

  const methods = React.useMemo(
    () => ({
      showOverlay,
      hideOverlay,
    }),
    [showOverlay, hideOverlay]
  );

  return (
    <ReactionsOverlayContext.Provider value={state}>
      <ReactionsOverlayControlContext.Provider value={methods}>
        {children}
      </ReactionsOverlayControlContext.Provider>
    </ReactionsOverlayContext.Provider>
  );
}

export function useReactionsOverlay() {
  return React.useContext(ReactionsOverlayContext);
}

export function useReactionsOverlayControls() {
  return React.useContext(ReactionsOverlayControlContext);
}
