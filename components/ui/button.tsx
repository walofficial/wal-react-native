import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
}

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    { variant = 'default', size = 'default', style, disabled, ...props },
    ref,
  ) => {
    return (
      <Pressable
        style={[
          styles.base,
          styles[variant],
          styles[size],
          disabled && styles.disabled,
          style,
        ]}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  // Variants
  default: {
    backgroundColor: '#0284c7', // primary color
  },
  destructive: {
    backgroundColor: '#ef4444', // destructive color
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb', // input border color
  },
  secondary: {
    backgroundColor: '#f3f4f6', // secondary color
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  // Sizes
  defaultSize: {
    height: 48, // native:h-12
    paddingHorizontal: 20, // native:px-5
    paddingVertical: 12, // native:py-3
  },
  sm: {
    height: 36, // h-9
    paddingHorizontal: 12, // px-3
    borderRadius: 6,
  },
  lg: {
    height: 56, // native:h-14
    paddingHorizontal: 32, // px-8
    borderRadius: 6,
  },
  icon: {
    height: 40, // h-10
    width: 40, // w-10
  },
  // States
  disabled: {
    opacity: 0.5,
  },
});

export { Button };
export type { ButtonProps };
