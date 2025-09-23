import { toastMainStyle } from '@/components/CustomToast';
import type {
  Toast,
  ToastContextValue,
  ToastOptions,
  MessageToastOptions,
  UploadingToastOptions,
} from '@/lib/types/Toast.types';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { MessageToast } from '@/components/MessageToast';
import { UploadingToast } from '@/components/UploadingToast';
import { useColorScheme } from '../useColorScheme';

const DEFAULT_TOAST_OPTIONS: Required<ToastOptions> = {
  duration: 3000,
  type: 'default',
  position: 'bottom',
  onClose: () => {},
  action: null,
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isDarkColorScheme } = useColorScheme();

  const show = useCallback(
    (content: React.ReactNode | string, options?: ToastOptions): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = {
        id,
        content,
        options: {
          ...DEFAULT_TOAST_OPTIONS,
          ...options,
        },
      };

      setToasts((prevToasts) => [...prevToasts, toast]);
      return id;
    },
    [],
  );

  const success = useCallback(
    ({ title, description }: { title: string; description?: string }) =>
      show(
        toastMainStyle({
          icon: 'checkmark-circle-outline',
          title: title,
          description: description,
          color: '#10B981',
          dark: isDarkColorScheme,
        }),
        {
          position: 'top',
        },
      ),
    [isDarkColorScheme],
  );
  const error = useCallback(
    ({ title, description }: { title: string; description?: string }) =>
      show(
        toastMainStyle({
          icon: 'alert-circle-outline',
          title: title,
          description: description,
          color: '#EF4444',
          dark: isDarkColorScheme,
        }),
        {
          position: 'top',
        },
      ),
    [isDarkColorScheme],
  );

  const info = useCallback(
    ({ title, description }: { title: string; description?: string }) =>
      show(
        toastMainStyle({
          icon: 'information-circle-outline',
          title: title,
          description: description,
          color: '#3B82F6',
          dark: isDarkColorScheme,
        }),
        {
          position: 'top',
        },
      ),
    [isDarkColorScheme],
  );

  const message = useCallback((options: MessageToastOptions) => {
    const content = (
      <MessageToast
        message={options.message || ''}
        senderUsername={options.senderUsername || ''}
        senderProfilePicture={options.senderProfilePicture || ''}
        senderId={options.senderId || ''}
        roomId={options.roomId || ''}
      />
    );
    return show(content, {
      ...options,
      type: 'message',
      position: 'top',
      duration: options.duration || 5000,
    });
  }, []);

  const uploading = useCallback((options: UploadingToastOptions) => {
    const content = (
      <UploadingToast
        label={options.label || 'Uploading…'}
        progress={typeof options.progress === 'number' ? options.progress : 0}
        mediaKind={options.mediaKind}
        cancellable={options.cancellable}
        onCancel={options.onCancel}
        previewUri={options.previewUri}
      />
    );
    // uploading toasts are persistent by default; caller should dismiss when done
    return show(content, {
      ...options,
      type: 'uploading',
      position: options.position || 'top',
      duration: 0,
    });
  }, [show]);

  const update = useCallback(
    (id: string, content: React.ReactNode | string, options?: ToastOptions) => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                content,
                options: {
                  ...toast.options,
                  ...options,
                },
              }
            : toast,
        ),
      );
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      if (toast.options.duration > 0) {
        const timeout = setTimeout(() => {
          dismiss(toast.id);
          toast.options.onClose?.();
        }, toast.options.duration);
        timeouts.push(timeout as any);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [toasts, dismiss]);

  const value: ToastContextValue = {
    toasts,
    show,
    uploading,
    update,
    dismiss,
    dismissAll,
    error,
    success,
    info,
    message,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
