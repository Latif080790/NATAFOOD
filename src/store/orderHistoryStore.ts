import { create } from 'zustand'

export interface OrderItem {
    name: string
    qty: number
    price: number
}

export interface OrderRecord {
    id: string
    type: 'dine-in' | 'takeaway' | 'delivery'
    table?: string
    platform?: string
    status: 'paid' | 'completed' | 'refunded'
    time: string
    date: string
    items: OrderItem[]
    subtotal: number
    discount: number
    discountLabel?: string
    tax: number
    total: number
    customer?: {
        name: string
        initials: string
        phone: string
        email: string
        memberSince: string
    }
    payment: {
        method: string
        icon: string
        transactionId: string
        status: string
    }
    kitchenNotes?: string
    server?: string
}

interface OrderHistoryState {
    orders: OrderRecord[]
    selectedOrderId: string | null
    selectOrder: (id: string) => void
}

const MOCK_ORDERS: OrderRecord[] = [
    {
        id: 'ORD-00124',
        type: 'dine-in',
        table: 'Table 04',
        status: 'paid',
        time: '10:42 AM',
        date: 'Feb 10, 2026',
        items: [
            { name: 'Nasi Goreng Special', qty: 2, price: 25000 },
            { name: 'Ayam Geprek', qty: 1, price: 18000 },
            { name: 'Es Teh Manis', qty: 2, price: 5000 },
            { name: 'Kerupuk', qty: 1, price: 3000 },
        ],
        subtotal: 81000,
        discount: 8100,
        discountLabel: 'Member 10%',
        tax: 5832,
        total: 78732,
        customer: {
            name: 'Budi Santoso',
            initials: 'BS',
            phone: '+62 812-3456-7890',
            email: 'budi.s@email.com',
            memberSince: '2024',
        },
        payment: {
            method: 'QRIS',
            icon: 'qr_code_2',
            transactionId: 'TX_QR20260210_001',
            status: 'Approved',
        },
        kitchenNotes: 'Nasi goreng level 2 pedas. Ayam geprek tanpa lalapan.',
        server: 'Rina',
    },
    {
        id: 'ORD-00123',
        type: 'takeaway',
        status: 'completed',
        time: '10:35 AM',
        date: 'Feb 10, 2026',
        items: [
            { name: 'Mie Ayam Bakso', qty: 1, price: 20000 },
            { name: 'Es Jeruk', qty: 1, price: 8000 },
        ],
        subtotal: 28000,
        discount: 0,
        tax: 2240,
        total: 30240,
        payment: {
            method: 'Cash',
            icon: 'payments',
            transactionId: 'TX_CASH20260210_002',
            status: 'Approved',
        },
        server: 'Dewi',
    },
    {
        id: 'ORD-00122',
        type: 'dine-in',
        table: 'Table 02',
        status: 'refunded',
        time: '10:15 AM',
        date: 'Feb 10, 2026',
        items: [
            { name: 'Soto Ayam', qty: 1, price: 22000 },
        ],
        subtotal: 22000,
        discount: 0,
        tax: 1760,
        total: 23760,
        customer: {
            name: 'Siti Aminah',
            initials: 'SA',
            phone: '+62 878-9012-3456',
            email: 'siti.a@email.com',
            memberSince: '2025',
        },
        payment: {
            method: 'Visa **** 4242',
            icon: 'credit_card',
            transactionId: 'TX_CC20260210_003',
            status: 'Refunded',
        },
        kitchenNotes: 'Pesanan dibatalkan karena terlalu lama.',
    },
    {
        id: 'ORD-00121',
        type: 'delivery',
        platform: 'GoFood',
        status: 'completed',
        time: '09:58 AM',
        date: 'Feb 10, 2026',
        items: [
            { name: 'Nasi Goreng Special', qty: 2, price: 25000 },
            { name: 'Ayam Bakar', qty: 1, price: 30000 },
            { name: 'Es Teh Manis', qty: 2, price: 5000 },
            { name: 'Tempe Goreng', qty: 1, price: 8000 },
            { name: 'Sambal Extra', qty: 1, price: 3000 },
        ],
        subtotal: 121000,
        discount: 0,
        tax: 9680,
        total: 130680,
        payment: {
            method: 'GoFood Pay',
            icon: 'account_balance_wallet',
            transactionId: 'TX_GF20260210_004',
            status: 'Approved',
        },
    },
    {
        id: 'ORD-00120',
        type: 'dine-in',
        table: 'Table 08',
        status: 'completed',
        time: '09:45 AM',
        date: 'Feb 10, 2026',
        items: [
            { name: 'Rendang Sapi', qty: 1, price: 35000 },
            { name: 'Nasi Putih', qty: 2, price: 5000 },
            { name: 'Es Campur', qty: 1, price: 12000 },
        ],
        subtotal: 57000,
        discount: 5700,
        discountLabel: 'Member 10%',
        tax: 4104,
        total: 55404,
        customer: {
            name: 'Ahmad Faisal',
            initials: 'AF',
            phone: '+62 856-7890-1234',
            email: 'ahmad.f@email.com',
            memberSince: '2023',
        },
        payment: {
            method: 'Debit BCA',
            icon: 'credit_card',
            transactionId: 'TX_DB20260210_005',
            status: 'Approved',
        },
        server: 'Rina',
    },
]

export const useOrderHistoryStore = create<OrderHistoryState>((set) => ({
    orders: MOCK_ORDERS,
    selectedOrderId: MOCK_ORDERS[0]?.id ?? null,
    selectOrder: (id) => set({ selectedOrderId: id }),
}))
