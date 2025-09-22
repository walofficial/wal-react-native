export type ToastType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'message';

export type ToastPosition = 'top' | 'bottom';

export interface ToastProps {
  children: React.ReactNode;
}
export interface ToastOptions {
  duration?: number;
  type?: ToastType;
  position?: ToastPosition;
  onClose?: () => void;
  action?: {
    label?: string;
    onPress?: () => void;
  } | null;
}

export interface MessageToastOptions extends Omit<ToastOptions, 'type'> {
  message?: string;
  senderUsername?: string;
  senderProfilePicture?: string;
  senderId?: string;
  roomId?: string;
}

export interface Toast {
  id: string;
  content: React.ReactNode | string;
  options: Required<ToastOptions>;
}

export interface ToastContextValue {
  toasts: Toast[];
  show: (content: React.ReactNode | string, options?: ToastOptions) => string;
  error: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => string;
  success: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => string;
  info: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => string;
  message: (options: MessageToastOptions) => string;
  update: (
    id: string,
    content: React.ReactNode | string,
    options?: ToastOptions,
  ) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
