import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from '@/store/toastStore'

export interface StockItem {
    id: string
    name: string
    sku: string
    category: string
    unit: string
    currentStock: number
    minStock: number
    maxStock: number
    image: string
}

interface InventoryState {
    stock: StockItem[]
    isLoading: boolean
    fetchStock: () => Promise<void>
    updateStock: (id: string, newQuantity: number) => Promise<void>
    subscribeToStock: () => void
    unsubscribeFromStock: () => void
}

export const useInventoryStore = create<InventoryState>((set) => ({
    stock: [],
    isLoading: false,

    fetchStock: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .order('name')

            if (error) throw error

            if (data) {
                const mappedStock: StockItem[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku || '',
                    category: item.category || 'Uncategorized',
                    unit: item.unit || 'units',
                    currentStock: Number(item.current_stock),
                    minStock: Number(item.min_stock),
                    maxStock: Number(item.max_stock) || 100,
                    image: item.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df'
                }))
                set({ stock: mappedStock })
            }
        } catch (error) {
            console.error('Error fetching inventory:', error)
            toast.error('Gagal memuat stok.')
        } finally {
            set({ isLoading: false })
        }
    },

    updateStock: async (id, newQuantity) => {
        // Optimistic update
        set((state) => ({
            stock: state.stock.map((item) =>
                item.id === id ? { ...item, currentStock: Math.max(0, newQuantity) } : item
            )
        }))

        try {
            const { error } = await supabase
                .from('inventory')
                .update({
                    current_stock: Math.max(0, newQuantity),
                    last_updated: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error
            toast.success('Stok berhasil diperbarui')
        } catch (error) {
            console.error('Error updating stock:', error)
            toast.error('Gagal update stok database')
            // Revert? (Not implemented)
        }
    },

    subscribeToStock: () => {
        supabase
            .channel('inventory-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory' },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        set(state => ({
                            stock: state.stock.map(item =>
                                item.id === payload.new.id
                                    ? {
                                        ...item,
                                        currentStock: payload.new.current_stock,
                                        name: payload.new.name, // In case name changes
                                        minStock: payload.new.min_stock
                                    }
                                    : item
                            )
                        }))
                    } else if (payload.eventType === 'INSERT') {
                        const newItem = payload.new
                        set(state => ({
                            stock: [...state.stock, {
                                id: newItem.id,
                                name: newItem.name,
                                sku: newItem.sku || '',
                                category: newItem.category || 'Uncategorized',
                                unit: newItem.unit || 'units',
                                currentStock: Number(newItem.current_stock),
                                minStock: Number(newItem.min_stock),
                                maxStock: Number(newItem.max_stock) || 100,
                                image: newItem.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df'
                            }]
                        }))
                    }
                }
            )
            .subscribe()
    },

    unsubscribeFromStock: () => {
        supabase.removeAllChannels()
    }
}))
