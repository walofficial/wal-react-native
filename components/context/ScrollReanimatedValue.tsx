import React, { createContext, useContext } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

const ScrollReanimatedValueContext = createContext<{
  scrollY: SharedValue<number>;
  hasMomentum: SharedValue<boolean>;
  lastScrollY: SharedValue<number>;
  headerTranslateY: SharedValue<number>;
  headerOpacity: SharedValue<number>;
}>({
  scrollY: {
    value: 0,
    get: () => 0,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
  },
  hasMomentum: {
    value: false,
    get: () => false,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
  },
  lastScrollY: {
    value: 0,
    get: () => 0,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
  },
  headerTranslateY: {
    value: 0,
    get: () => 0,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
  },
  headerOpacity: {
    value: 1,
    get: () => 1,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
  },
});

export const ScrollReanimatedValueProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const scrollY = useSharedValue(0); // Initial value of 0
  const hasMomentum = useSharedValue(false);
  const lastScrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  return (
    <ScrollReanimatedValueContext.Provider
      value={{
        scrollY,
        hasMomentum,
        lastScrollY,
        headerTranslateY,
        headerOpacity,
      }}
    >
      {children}
    </ScrollReanimatedValueContext.Provider>
  );
};

export const useScrollReanimatedValue = () => {
  const { scrollY, hasMomentum, lastScrollY, headerTranslateY, headerOpacity } =
    useContext(ScrollReanimatedValueContext);
  return { scrollY, hasMomentum, lastScrollY, headerTranslateY, headerOpacity };
};
