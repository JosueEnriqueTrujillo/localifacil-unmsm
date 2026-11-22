import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

const toasts = ref<ToastItem[]>([]);
let nextToastId = 1;

export function useToast() {
  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const addToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration = 4500
  ) => {
    const id = nextToastId++;
    toasts.value.push({ id, type, title, message });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  return {
    toasts,
    removeToast,
    success: (title: string, message?: string) =>
      addToast('success', title, message),
    error: (title: string, message?: string) =>
      addToast('error', title, message, 6000),
    info: (title: string, message?: string) => addToast('info', title, message),
    warning: (title: string, message?: string) =>
      addToast('warning', title, message, 5500),
  };
}
