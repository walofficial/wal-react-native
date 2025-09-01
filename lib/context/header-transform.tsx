import React from 'react';
import {
  SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type StateContext = {
  headerMode: SharedValue<number>;
};
type SetContext = (v: boolean) => void;

const StateContext = React.createContext<StateContext>({
  headerMode: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0;
    },
    set() {},
  },
});

const SetContext = React.createContext<SetContext>((_: boolean) => {});

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0);
  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet';
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      );
    },
    [headerMode],
  );
  const value = React.useMemo(
    () => ({
      headerMode,
    }),
    [headerMode],
  );
  return (
    <StateContext.Provider value={value}>
      <SetContext.Provider value={setMode}>{children}</SetContext.Provider>
    </StateContext.Provider>
  );
}

export function useMinimalShellMode() {
  return React.useContext(StateContext);
}

export function useSetMinimalShellMode() {
  return React.useContext(SetContext);
}
