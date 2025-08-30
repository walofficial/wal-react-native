import * as Slot from '~/components/primitives/slot';
import { SlottableTextProps, TextRef } from '~/components/primitives/types';
import * as React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

const TextClassContext = React.createContext<{ style?: any }>({
  style: undefined,
});

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({ style, asChild = false, ...props }, ref) => {
    const textContext = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    return (
      <Component
        style={[styles.text, textContext.style, style]}
        ref={ref}
        {...props}
      />
    );
  },
);
Text.displayName = 'Text';

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#000000',
  },
});

export { Text, TextClassContext };
