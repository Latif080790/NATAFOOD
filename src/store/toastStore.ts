import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
    id: string
    message: string
    variant: ToastVariant
    duration?: number
}

interface ToastState {
    toasts: Toast[]
    addToast: (message: string, variant?: ToastVariant, duration?: number) => void
    removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, variant = 'info', duration = 3000) => {
        const id = Math.random().toString(36).slice(2, 9)
        set((state) => ({
            toasts: [...state.toasts, { id, message, variant, duration }],
        }))
        // Auto-remove
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }))
        }, duration)
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))

/** Convenience helpers */
export const toast = {
    success: (message: string) => useToastStore.getState().addToast(message, 'success'),
    error: (message: string) => useToastStore.getState().addToast(message, 'error'),
    info: (message: string) => useToastStore.getState().addToast(message, 'info'),
}
