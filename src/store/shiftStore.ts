import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface Shift {
    id: string
    start_time: string
    start_cash: number
    status: 'open' | 'closed'
}

interface ShiftState {
    activeShift: Shift | null
    loading: boolean
    checkActiveShift: () => Promise<void>
    openShift: (startCash: number) => Promise<void>
    closeShift: (actualCash: number, notes: string) => Promise<void>
}

export const useShiftStore = create<ShiftState>()(
    persist(
        (set, get) => ({
            activeShift: null,
            loading: true,

            checkActiveShift: async () => {
                set({ loading: true })
                try {
                    // Check local storage / persist first? No, always check DB for truth
                    // Assuming one active shift per staff? Or one per device?
                    // Usually one per staff.
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return

                    const { data, error } = await supabase
                        .from('shifts')
                        .select('*')
                        .eq('staff_id', user.id)
                        .eq('status', 'open')
                        .maybeSingle()

                    if (error) throw error
                    set({ activeShift: data })
                } catch (err) {
                    console.error('Check shift error:', err)
                } finally {
                    set({ loading: false })
                }
            },

            openShift: async (startCash) => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Not authenticated')

                const { data, error } = await supabase
                    .from('shifts')
                    .insert({
                        staff_id: user.id,
                        start_cash: startCash,
                        status: 'open',
                        start_time: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (error) throw error
                set({ activeShift: data })
            },

            closeShift: async (actualCash, notes) => {
                const { activeShift } = get()
                if (!activeShift) throw new Error('No active shift')

                // Calculate system cash (TODO: Server side or Client aggregation)
                // For now we just update the shift status. 
                // Creating a summary report needs to aggregate orders within shift timeframe.

                const { error } = await supabase
                    .from('shifts')
                    .update({
                        end_time: new Date().toISOString(),
                        end_cash_actual: actualCash,
                        status: 'closed',
                        notes: notes
                    })
                    .eq('id', activeShift.id)

                if (error) throw error
                set({ activeShift: null })
            }
        }),
        {
            name: 'shift-storage',
            partialize: (state) => ({ activeShift: state.activeShift }), // Persist activeShift
        }
    )
)
