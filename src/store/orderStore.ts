import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'waiting' | 'cooking' | 'ready' | 'completed' | 'refunded'
export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface OrderItem {
    name: string
    quantity: number
    price: number
    notes?: string
}

export interface OrderPayment {
    method: string
    icon: string
    transactionId: string
    status: 'Approved' | 'Refunded' | 'Pending'
}

export interface OrderCustomer {
    name: string
    initials: string
    phone: string
    email: string
    memberSince: string
}

export interface Order {
    id: string
    type: OrderType
    status: OrderStatus
    items: OrderItem[]
    table?: string
    platform?: string
    server?: string
    guestCount?: number
    createdAt: Date
    // Pricing
    subtotal: number
    discount: number
    discountLabel?: string
    tax: number
    total: number
    // Optional details
    customer?: OrderCustomer
    payment?: OrderPayment
    kitchenNotes?: string
}

// ─── State ──────────────────────────────────────────────────────────────────
interface OrderState {
    orders: Order[]
    selectedOrderId: string | null
    // Actions
    addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => string
    updateStatus: (id: string, status: OrderStatus) => void
    selectOrder: (id: string) => void
    // Computed helpers
    getActiveOrders: () => Order[]
    getCompletedOrders: () => Order[]
    getOrderById: (id: string) => Order | undefined
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const TAX_RATE = 0.08
let orderSeq = 130

function nextOrderId(): string {
    orderSeq++
    return `ORD-${String(orderSeq).padStart(5, '0')}`
}

export function calculateOrderTotals(items: OrderItem[], discountPercent = 0) {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const discount = Math.round(subtotal * discountPercent)
    const tax = Math.round((subtotal - discount) * TAX_RATE)
    const total = subtotal - discount + tax
    return { subtotal, discount, tax, total }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const now = Date.now()
const SEED_ORDERS: Order[] = [
    // Active kitchen orders
    {
        id: 'ORD-00128',
        type: 'dine-in',
        table: 'Table 04',
        server: 'Sarah',
        status: 'waiting',
        items: [
            { name: 'Nasi Goreng Spesial', quantity: 2, price: 25000 },
            { name: 'Es Teh Manis', quantity: 2, price: 5000, notes: 'Less sugar' },
        ],
        createdAt: new Date(now - 45_000),
        subtotal: 60000, discount: 0, tax: 4800, total: 64800,
        kitchenNotes: 'Level 2 pedas',
    },
    {
        id: 'ORD-00127',
        type: 'takeaway',
        server: 'Mike',
        status: 'waiting',
        items: [
            { name: 'Ayam Bakar Madu', quantity: 1, price: 30000 },
            { name: 'Es Teler Sultan', quantity: 1, price: 18000 },
        ],
        createdAt: new Date(now - 2 * 60_000 - 15_000),
        subtotal: 48000, discount: 0, tax: 3840, total: 51840,
    },
    {
        id: 'ORD-00126',
        type: 'dine-in',
        table: 'Table 12',
        guestCount: 4,
        status: 'cooking',
        items: [
            { name: 'Nasi Goreng Spesial', quantity: 3, price: 25000, notes: 'PRIORITY' },
            { name: 'Pudding Coklat Lumer', quantity: 1, price: 15000 },
        ],
        createdAt: new Date(now - 11 * 60_000),
        subtotal: 90000, discount: 0, tax: 7200, total: 97200,
    },
    {
        id: 'ORD-00125',
        type: 'dine-in',
        table: 'Table 08',
        status: 'cooking',
        items: [
            { name: 'Es Teler Sultan', quantity: 1, price: 18000 },
            { name: 'Ayam Bakar Madu', quantity: 1, price: 30000, notes: 'No Onion' },
        ],
        createdAt: new Date(now - 6 * 60_000),
        subtotal: 48000, discount: 0, tax: 3840, total: 51840,
    },
    {
        id: 'ORD-00124',
        type: 'dine-in',
        table: 'Table 05',
        status: 'ready',
        items: [
            { name: 'Es Teh Manis', quantity: 2, price: 5000, notes: 'Extra Sauce' },
        ],
        createdAt: new Date(now - 15 * 60_000),
        subtotal: 10000, discount: 0, tax: 800, total: 10800,
    },
    // Completed orders (visible in Order History)
    {
        id: 'ORD-00123',
        type: 'dine-in',
        table: 'Table 04',
        status: 'completed',
        items: [
            { name: 'Nasi Goreng Spesial', quantity: 2, price: 25000 },
            { name: 'Ayam Bakar Madu', quantity: 1, price: 30000 },
            { name: 'Es Teh Manis', quantity: 2, price: 5000 },
        ],
        createdAt: new Date(now - 45 * 60_000),
        subtotal: 90000, discount: 9000, discountLabel: 'Member 10%', tax: 6480, total: 87480,
        customer: {
            name: 'Budi Santoso', initials: 'BS',
            phone: '+62 812-3456-7890', email: 'budi.s@email.com', memberSince: '2024',
        },
        payment: { method: 'QRIS', icon: 'qr_code_2', transactionId: 'TX_QR001', status: 'Approved' },
    },
    {
        id: 'ORD-00122',
        type: 'takeaway',
        status: 'completed',
        items: [
            { name: 'Pudding Coklat Lumer', quantity: 2, price: 15000 },
            { name: 'Es Teler Sultan', quantity: 1, price: 18000 },
        ],
        createdAt: new Date(now - 90 * 60_000),
        subtotal: 48000, discount: 0, tax: 3840, total: 51840,
        payment: { method: 'Cash', icon: 'payments', transactionId: 'TX_CASH002', status: 'Approved' },
    },
    {
        id: 'ORD-00121',
        type: 'dine-in',
        table: 'Table 02',
        status: 'refunded',
        items: [
            { name: 'Ayam Bakar Madu', quantity: 1, price: 30000 },
        ],
        createdAt: new Date(now - 120 * 60_000),
        subtotal: 30000, discount: 0, tax: 2400, total: 32400,
        customer: {
            name: 'Siti Aminah', initials: 'SA',
            phone: '+62 878-9012-3456', email: 'siti.a@email.com', memberSince: '2025',
        },
        payment: { method: 'Visa **** 4242', icon: 'credit_card', transactionId: 'TX_CC003', status: 'Refunded' },
        kitchenNotes: 'Pesanan dibatalkan — terlalu lama.',
    },
    {
        id: 'ORD-00120',
        type: 'delivery',
        platform: 'GoFood',
        status: 'completed',
        items: [
            { name: 'Nasi Goreng Spesial', quantity: 2, price: 25000 },
            { name: 'Ayam Bakar Madu', quantity: 1, price: 30000 },
            { name: 'Es Teh Manis', quantity: 2, price: 5000 },
        ],
        createdAt: new Date(now - 150 * 60_000),
        subtotal: 90000, discount: 0, tax: 7200, total: 97200,
        payment: { method: 'GoFood Pay', icon: 'account_balance_wallet', transactionId: 'TX_GF004', status: 'Approved' },
    },
]

// ─── Store ──────────────────────────────────────────────────────────────────
export const useOrderStore = create<OrderState>((set, get) => ({
    orders: SEED_ORDERS,
    selectedOrderId: SEED_ORDERS.find(o => o.status === 'completed')?.id ?? null,

    addOrder: (orderData) => {
        const id = nextOrderId()
        set((state) => ({
            orders: [{
                ...orderData,
                id,
                status: 'waiting' as OrderStatus,
                createdAt: new Date(),
            }, ...state.orders],
        }))
        return id
    },

    updateStatus: (id, status) => set((state) => ({
        orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
        ),
    })),

    selectOrder: (id) => set({ selectedOrderId: id }),

    getActiveOrders: () =>
        get().orders.filter(o => ['waiting', 'cooking', 'ready'].includes(o.status)),

    getCompletedOrders: () =>
        get().orders.filter(o => ['completed', 'refunded'].includes(o.status)),

    getOrderById: (id) => get().orders.find(o => o.id === id),
}))
