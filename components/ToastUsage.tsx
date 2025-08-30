import { ToastProvider, useToast } from '@/lib/context/ToastContext';
import type { ToastOptions, ToastProps } from '@/lib/types/Toast.types';
import * as React from 'react';
import { ToastViewport } from './ToastViewport';
type ToastRef = {
  show?: (content: React.ReactNode | string, options?: ToastOptions) => string;
  update?: (
    id: string,
    content: React.ReactNode | string,
    options?: ToastOptions,
  ) => void;
  dismiss?: (id: string) => void;
  dismissAll?: () => void;
};

const toastRef: ToastRef = {};

const ToastController: React.FC = () => {
  const toast = useToast();

  toastRef.show = toast.show;
  toastRef.update = toast.update;
  toastRef.dismiss = toast.dismiss;
  toastRef.dismissAll = toast.dismissAll;

  return null;
};

export const ToastProviderWithViewport: React.FC<ToastProps> = ({
  children,
}) => {
  return (
    <ToastProvider>
      <ToastController />
      {children}
      <ToastViewport />
    </ToastProvider>
  );
};

export const Toast = {
  show: (content: React.ReactNode | string, options?: ToastOptions): string => {
    if (!toastRef.show) {
      console.warn(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return '';
    }
    return toastRef.show(content, options);
  },
  update: (
    id: string,
    content: React.ReactNode | string,
    options?: ToastOptions,
  ): void => {
    if (!toastRef.update) {
      console.warn(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.update(id, content, options);
  },
  dismiss: (id: string): void => {
    if (!toastRef.dismiss) {
      console.warn(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.dismiss(id);
  },
  dismissAll: (): void => {
    if (!toastRef.dismissAll) {
      console.warn(
        'Toast provider not initialized. Make sure you have wrapped your app with ToastProviderWithViewport.',
      );
      return;
    }
    return toastRef.dismissAll();
  },
};

export { ToastProvider, useToast } from '@/lib/context/ToastContext';
export type {
  ToastOptions,
  ToastPosition,
  ToastType,
} from '@/lib/types/Toast.types';
