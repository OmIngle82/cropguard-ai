import { create } from 'zustand';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

interface ConfirmState {
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
    prompt: (options: ConfirmOptions) => Promise<boolean>;
    close: (result: boolean) => void;
}

const defaultOptions = {
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false
};

export const useConfirmStore = create<ConfirmState>((set) => ({
    isOpen: false,
    options: defaultOptions,
    resolve: null,
    prompt: (options) => {
        return new Promise<boolean>((resolve) => {
            set({
                isOpen: true,
                options: { ...defaultOptions, ...options },
                resolve
            });
        });
    },
    close: (result: boolean) => {
        set((state) => {
            if (state.resolve) state.resolve(result);
            return { isOpen: false, resolve: null };
        });
    }
}));

export const confirmPrompt = (options: ConfirmOptions) => useConfirmStore.getState().prompt(options);
