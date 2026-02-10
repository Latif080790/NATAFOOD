import { create } from 'zustand'

export type OrderStatus = 'waiting' | 'cooking' | 'ready' | 'completed'

export interface OrderItem {
    name: string
    quantity: number
    notes?: string
}

export interface KitchenOrder {
    id: string
    items: OrderItem[]
    status: OrderStatus
    createdAt: Date
    type: 'dine-in' | 'takeaway' | 'delivery'
    table?: string
    server?: string
    guestCount?: number
}

interface OrderState {
    orders: KitchenOrder[]
    addOrder: (order: Omit<KitchenOrder, 'id' | 'createdAt' | 'status'>) => void
    updateStatus: (id: string, status: OrderStatus) => void
}

// Mock initial data
const INITIAL_ORDERS: KitchenOrder[] = [
    {
        id: '105',
        type: 'dine-in',
        table: 'Table 04',
        server: 'Sarah',
        items: [{ name: 'Mango Sticky Rice', quantity: 1 }, { name: 'Iced Americano', quantity: 1, notes: 'Less sugar' }],
        status: 'waiting',
        createdAt: new Date(Date.now() - 1000 * 45) // 45 secs ago
    },
    {
        id: '104',
        type: 'takeaway',
        server: 'Mike', // Guest name for takeaway
        items: [{ name: 'Croffle Original', quantity: 2 }, { name: 'Vanilla Latte', quantity: 1 }],
        status: 'waiting',
        createdAt: new Date(Date.now() - 1000 * 60 * 2 - 1000 * 15) // 2m 15s ago
    },
    {
        id: '098',
        type: 'dine-in',
        table: 'Table 12',
        guestCount: 4,
        items: [{ name: 'Pancakes Stack', quantity: 3, notes: 'PRIORITY' }, { name: 'Choco Lava', quantity: 1 }],
        status: 'cooking',
        createdAt: new Date(Date.now() - 1000 * 60 * 11 - 1000 * 32) // 11m 32s ago (Critical)
    },
    {
        id: '099',
        type: 'dine-in',
        table: 'Table 08',
        items: [{ name: 'Es Teler Special', quantity: 1 }, { name: 'Avocado Toast', quantity: 1, notes: 'No Onion' }],
        status: 'cooking',
        createdAt: new Date(Date.now() - 1000 * 60 * 6 - 1000 * 15) // 6m 15s ago (Warning)
    },
    {
        id: '102',
        type: 'dine-in',
        table: 'Table 05',
        items: [{ name: 'French Fries', quantity: 2, notes: 'Extra Sauce' }],
        status: 'cooking',
        createdAt: new Date(Date.now() - 1000 * 60 * 1 - 1000 * 20) // 1m 20s ago
    },
    {
        id: '095',
        type: 'dine-in',
        table: 'Table 01',
        items: [{ name: 'Hot Coffee', quantity: 2 }],
        status: 'ready',
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
    },
    {
        id: '097',
        type: 'takeaway',
        server: 'Waiter Called',
        items: [{ name: 'Caesar Salad', quantity: 1 }, { name: 'Mushroom Soup', quantity: 1 }],
        status: 'ready',
        createdAt: new Date(Date.now() - 1000 * 60 * 18) // 18 mins ago
    }
]

export const useOrderStore = create<OrderState>((set) => ({
    orders: INITIAL_ORDERS,
    addOrder: (orderData) => set((state) => ({
        orders: [...state.orders, {
            ...orderData,
            id: Math.random().toString(36).substr(2, 9),
            status: 'waiting',
            createdAt: new Date()
        }]
    })),
    updateStatus: (id, status) => set((state) => ({
        orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
        )
    })),
}))
