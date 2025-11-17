import { useCallback } from 'react';
import { ToastMessage } from '@/types';

// Toast state (simplified version - could be enhanced with Zustand)
type ToastState = {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
};

// Global toast state
let toastState: ToastState = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
};

// Subscribers
const subscribers = new Set<(toasts: ToastMessage[]) => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback(toastState.toasts));
}

/**
 * Add a toast notification
 */
function addToast(toast: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = {
    ...toast,
    id,
    duration: toast.duration ?? 5000,
  };

  toastState.toasts = [...toastState.toasts, newToast];
  notifySubscribers();

  // Auto-remove toast after duration
  if (newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }

  return id;
}

/**
 * Remove a toast notification
 */
function removeToast(id: string) {
  toastState.toasts = toastState.toasts.filter((toast) => toast.id !== id);
  notifySubscribers();
}

/**
 * Custom hook to manage toast notifications
 * @returns Object with toast methods
 */
export function useToast() {
  const toast = useCallback((props: Omit<ToastMessage, 'id'>) => {
    return addToast(props);
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addToast({
      title,
      description,
      variant: 'success',
    });
  }, []);

  const error = useCallback((title: string, description?: string) => {
    return addToast({
      title,
      description,
      variant: 'destructive',
    });
  }, []);

  const info = useCallback((title: string, description?: string) => {
    return addToast({
      title,
      description,
      variant: 'default',
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toast,
    success,
    error,
    info,
    dismiss,
  };
}

/**
 * Hook to get all toasts (used by Toaster component)
 */
export function useToastState() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>(toastState.toasts);

  React.useEffect(() => {
    const callback = (newToasts: ToastMessage[]) => {
      setToasts(newToasts);
    };

    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  return {
    toasts,
    removeToast,
  };
}

// Import React for useEffect and useState
import * as React from 'react';
