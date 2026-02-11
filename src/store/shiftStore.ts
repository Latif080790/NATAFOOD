import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { toast } from '@/store/toastStore'

export interface Shift {
    id: string
    user_id: string
    start_cash: number
    end_cash: number | null
    expected_cash: number | null
    status: 'open' | 'closed'
    opened_at: string
    closed_at: string | null
}

interface ShiftState {
    activeShift: Shift | null
    isLoading: boolean
    fetchActiveShift: () => Promise<void>
    openShift: (startCash: number) => Promise<boolean>
    closeShift: (endCash: number) => Promise<{ expected: number; actual: number; difference: number } | null>
}

export const useShiftStore = create<ShiftState>()(
    persist(
        (set, get) => ({
            activeShift: null,
            isLoading: false,

            fetchActiveShift: async () => {
                set({ isLoading: true })
                try {
                    const { data, error } = await supabase
                        .from('shifts')
                        .select('*')
                        .eq('status', 'open')
                        .order('opened_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    if (error) throw error
                    set({ activeShift: data || null })
                } catch (err) {
                    console.error('Error fetching shift:', err)
                } finally {
                    set({ isLoading: false })
                }
            },

            openShift: async (startCash: number) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('Not authenticated')

                    const { data, error } = await supabase
                        .from('shifts')
                        .insert([{
                            user_id: user.id,
                            start_cash: startCash,
                            status: 'open',
                        }])
                        .select()
                        .single()

                    if (error) throw error
                    set({ activeShift: data })
                    toast.success(`Shift dibuka! Modal awal: Rp ${startCash.toLocaleString('id-ID')}`)
                    return true
                } catch (err) {
                    console.error('Error opening shift:', err)
                    toast.error('Gagal membuka shift. Pastikan tabel "shifts" sudah dibuat.')
                    return false
                }
            },

            closeShift: async (endCash: number) => {
                const shift = get().activeShift
                if (!shift) return null

                try {
                    // Calculate expected cash: start_cash + revenue during shift
                    const { data: orders } = await supabase
                        .from('orders')
                        .select('total')
                        .eq('status', 'completed')
                        .gte('created_at', shift.opened_at)

                    const revenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
                    const expectedCash = shift.start_cash + revenue

                    const { error } = await supabase
                        .from('shifts')
                        .update({
                            end_cash: endCash,
                            expected_cash: expectedCash,
                            status: 'closed',
                            closed_at: new Date().toISOString(),
                        })
                        .eq('id', shift.id)

                    if (error) throw error

                    const result = {
                        expected: expectedCash,
                        actual: endCash,
                        difference: endCash - expectedCash,
                    }

                    set({ activeShift: null })
                    toast.success('Shift berhasil ditutup!')
                    return result
                } catch (err) {
                    console.error('Error closing shift:', err)
                    toast.error('Gagal menutup shift.')
                    return null
                }
            },
        }),
        { name: 'natafood-shift' }
    )
)
