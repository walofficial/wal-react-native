import * as LabelPrimitive from '~/components/primitives/label';
import * as React from 'react';
import { StyleSheet } from 'react-native';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Text>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text>
>(({ style, onPress, onLongPress, onPressIn, onPressOut, ...props }, ref) => (
  <LabelPrimitive.Root
    style={styles.root}
    onPress={onPress}
    onLongPress={onLongPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
  >
    <LabelPrimitive.Text ref={ref} style={[styles.text, style]} {...props} />
  </LabelPrimitive.Root>
));

Label.displayName = LabelPrimitive.Root.displayName;

const styles = StyleSheet.create({
  root: {
    // web:cursor-default is web-only so we omit it
  },
  text: {
    fontSize: 16, // native:text-base
    fontWeight: '500', // font-medium
    lineHeight: 16, // leading-none
    color: '#000', // text-foreground
  },
});

export { Label };
