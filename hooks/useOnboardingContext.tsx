import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenSpaceInfo: boolean;
  hasSeenContactSync: boolean;
  // Add more onboarding states here as needed
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  markTutorialAsSeen: (tutorialKey: keyof OnboardingState) => Promise<void>;
}

const defaultState: OnboardingState = {
  hasSeenSpaceInfo: false,
  hasSeenContactSync: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(defaultState);

  useEffect(() => {
    // Load all onboarding states when the provider mounts
    const loadOnboardingStates = async () => {
      try {
        const hasSeenSpaceInfo = await AsyncStorage.getItem('hasSeenSpaceInfo');
        const hasSeenContactSync =
          await AsyncStorage.getItem('hasSeenContactSync');
        setOnboardingState((state) => ({
          ...state,
          hasSeenSpaceInfo: !!hasSeenSpaceInfo,
          hasSeenContactSync: !!hasSeenContactSync,
        }));
      } catch (error) {
        console.error('Failed to load onboarding states:', error);
      }
    };

    loadOnboardingStates();
  }, []);

  const markTutorialAsSeen = async (tutorialKey: keyof OnboardingState) => {
    try {
      const storageKey = tutorialKey;
      await AsyncStorage.setItem(storageKey, 'true');
      setOnboardingState((state) => ({
        ...state,
        [tutorialKey]: true,
      }));
    } catch (error) {
      console.error('Failed to mark tutorial as seen:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ onboardingState, markTutorialAsSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
