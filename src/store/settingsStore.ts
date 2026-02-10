import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    // Store Profile
    storeName: string
    storeAddress: string
    storePhone: string
    // Tax & Pricing
    taxRate: number   // e.g. 0.08 for 8%
    serviceCharge: number  // e.g. 0.05 for 5%
    // Appearance
    theme: 'light' | 'dark' | 'system'
    density: 'compact' | 'comfortable'
    // Printer
    printerEnabled: boolean
    printerName: string
    // Actions
    updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
    resetDefaults: () => void
}

const DEFAULTS = {
    storeName: 'NataFood',
    storeAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    storePhone: '+62 21 1234-5678',
    taxRate: 0.08,
    serviceCharge: 0,
    theme: 'light' as const,
    density: 'comfortable' as const,
    printerEnabled: false,
    printerName: '',
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...DEFAULTS,
            updateSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
            resetDefaults: () => set(DEFAULTS),
        }),
        {
            name: 'natafood-settings',
            partialize: (state) => ({
                storeName: state.storeName,
                storeAddress: state.storeAddress,
                storePhone: state.storePhone,
                taxRate: state.taxRate,
                serviceCharge: state.serviceCharge,
                theme: state.theme,
                density: state.density,
                printerEnabled: state.printerEnabled,
                printerName: state.printerName,
            }),
        }
    )
)
