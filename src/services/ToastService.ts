import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, default 4000
}

interface ToastState {
    toasts: Toast[];
    show: (toast: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    show: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, toast.duration ?? 4000);
    },
    dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helper — can be called outside React components
export const toast = {
    success: (title: string, message?: string) =>
        useToastStore.getState().show({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
        useToastStore.getState().show({ type: 'error', title, message }),
    info: (title: string, message?: string) =>
        useToastStore.getState().show({ type: 'info', title, message }),
    warning: (title: string, message?: string) =>
        useToastStore.getState().show({ type: 'warning', title, message }),
};
