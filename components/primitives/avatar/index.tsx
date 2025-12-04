import * as React from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import type { ImageLoadEventData, ImageErrorEventData } from 'expo-image';
import * as Slot from '~/components/primitives/slot';
import {
  ComponentPropsWithAsChild,
  SlottableViewProps,
  ViewRef,
} from '~/components/primitives/types';
import { AvatarImageProps, AvatarRootProps } from './types';

type AvatarState = 'loading' | 'error' | 'loaded';

interface IRootContext extends AvatarRootProps {
  status: AvatarState;
  setStatus: (status: AvatarState) => void;
}

const RootContext = React.createContext<IRootContext | null>(null);

const Root = React.forwardRef<ViewRef, SlottableViewProps & AvatarRootProps>(
  ({ asChild, alt, ...viewProps }, ref) => {
    const [status, setStatus] = React.useState<AvatarState>('loading');
    const Component = asChild ? Slot.View : View;
    return (
      <RootContext.Provider value={{ alt, status, setStatus }}>
        <Component ref={ref} {...viewProps} />
      </RootContext.Provider>
    );
  },
);

Root.displayName = 'RootAvatar';

function useRootContext() {
  const context = React.useContext(RootContext);
  if (!context) {
    throw new Error(
      'Avatar compound components cannot be rendered outside the Avatar component',
    );
  }
  return context;
}

const Image = React.forwardRef<
  React.ElementRef<typeof ExpoImage>,
  React.ComponentPropsWithoutRef<typeof ExpoImage> &
    AvatarImageProps & { asChild?: boolean }
>(
  (
    {
      asChild,
      onLoad: onLoadProps,
      onError: onErrorProps,
      onLoadingStatusChange,
      transition = 300,
      ...restProps
    },
    ref,
  ) => {
    const { alt, setStatus, status } = useRootContext();

    const onLoad = React.useCallback(
      (e: ImageLoadEventData) => {
        setStatus('loaded');
        onLoadingStatusChange?.('loaded');
        onLoadProps?.(e as any);
      },
      [onLoadProps, onLoadingStatusChange, setStatus],
    );

    const onError = React.useCallback(
      (e: ImageErrorEventData) => {
        setStatus('error');
        onLoadingStatusChange?.('error');
        onErrorProps?.(e as any);
      },
      [onErrorProps, onLoadingStatusChange, setStatus],
    );

    if (status === 'error') {
      return null;
    }

    if (asChild) {
      // When using asChild, we need to pass compatible props to Slot.Image (React Native Image)
      return (
        <Slot.Image
          ref={ref as any}
          alt={alt}
          onLoad={onLoad as any}
          onError={onError as any}
          {...(restProps as any)}
        />
      );
    }

    return (
      <ExpoImage
        ref={ref}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        transition={transition}
        {...restProps}
      />
    );
  },
);

Image.displayName = 'ImageAvatar';

const Fallback = React.forwardRef<ViewRef, SlottableViewProps>(
  ({ asChild, ...props }, ref) => {
    const { alt, status } = useRootContext();

    if (status !== 'error') {
      return null;
    }
    const Component = asChild ? Slot.View : View;
    return <Component ref={ref} role={'img'} aria-label={alt} {...props} />;
  },
);

Fallback.displayName = 'FallbackAvatar';

export { Fallback, Image, Root };
