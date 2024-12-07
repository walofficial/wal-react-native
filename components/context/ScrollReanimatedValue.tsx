import React, { createContext, useContext } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

const ScrollReanimatedValueContext = createContext<{
  scrollY: SharedValue<number>;
  hasMomentum: SharedValue<boolean>;
  lastScrollY: SharedValue<number>;
  headerTranslateY: SharedValue<number>;
  headerOpacity: SharedValue<number>;
}>({
  scrollY: { value: 0 },
  hasMomentum: { value: false },
  lastScrollY: { value: 0 },
  headerTranslateY: { value: 0 },
  headerOpacity: { value: 1 },
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
