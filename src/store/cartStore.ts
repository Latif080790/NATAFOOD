import { create } from 'zustand'

export interface MenuItem {
    id: string
    name: string
    price: number
    category: string
    image: string
    status: 'available' | 'cooking' | 'sold_out'
}

export interface CartItem extends MenuItem {
    quantity: number
    notes?: string
}

interface CartState {
    items: CartItem[]
    addItem: (item: MenuItem, quantity?: number, notes?: string) => void
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addItem: (item, quantity = 1, notes = '') => set((state) => {
        // Check if item with same ID AND same notes exists
        const existingItem = state.items.find((i) => i.id === item.id && i.notes === notes)

        if (existingItem) {
            return {
                items: state.items.map((i) =>
                    i.id === item.id && i.notes === notes ? { ...i, quantity: i.quantity + quantity } : i
                ),
            }
        }
        return { items: [...state.items, { ...item, quantity, notes }] }
    }),
    removeItem: (itemId) => set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
    })),
    updateQuantity: (itemId, quantity) => set((state) => ({
        items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
        ).filter((i) => i.quantity > 0),
    })),
    clearCart: () => set({ items: [] }),
    total: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    },
}))
