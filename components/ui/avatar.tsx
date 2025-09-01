import * as React from 'react';
import { StyleSheet } from 'react-native';
import * as AvatarPrimitive from '~/components/primitives/avatar';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ style, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} style={[styles.root, style]} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ style, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} style={[styles.image, style]} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ style, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    style={[styles.fallback, style]}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    flexDirection: 'row',
    height: 40,
    width: 40,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 9999,
  },
  image: {
    aspectRatio: 1,
    height: '100%',
    width: '100%',
  },
  fallback: {
    flex: 1,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: '#e5e5e5', // muted color
  },
});

export { Avatar, AvatarFallback, AvatarImage };
