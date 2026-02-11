import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast as customToast } from './toastStore'

// ─── Types ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'waiting' | 'cooking' | 'ready' | 'completed' | 'refunded' | 'cancelled'
export type OrderType = 'dine-in' | 'take-away' | 'takeaway' | 'delivery'

export interface OrderItem {
    id?: string
    name: string
    quantity: number
    price: number
    notes?: string
    productId?: string
}

export interface OrderPayment {
    method: string
    icon: string
    transactionId: string
    status: 'Approved' | 'Refunded' | 'Pending'
    cashReceived?: number
    change?: number
}

export interface OrderCustomer {
    name: string
    initials: string
    phone: string
    email?: string
    memberSince?: string
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
    createdAt: string

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

// ─── Helpers ────────────────────────────────────────────────────────────────
const TAX_RATE = 0.08 // Should ideally come from settings

export function calculateOrderTotals(items: OrderItem[], discountPercent = 0) {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const discount = Math.round(subtotal * discountPercent)
    const tax = Math.round((subtotal - discount) * TAX_RATE)
    const total = subtotal - discount + tax
    return { subtotal, discount, tax, total }
}

// ─── State ──────────────────────────────────────────────────────────────────
interface OrderState {
    orders: Order[]
    selectedOrderId: string | null
    isLoading: boolean

    // Actions
    fetchOrders: () => Promise<void>
    subscribeToOrders: () => void
    unsubscribeFromOrders: () => void

    addOrder: (order: Partial<Order>) => Promise<string | null>
    updateStatus: (id: string, status: OrderStatus) => Promise<void>
    selectOrder: (id: string | null) => void

    // Computed helpers
    getActiveOrders: () => Order[]
    getCompletedOrders: () => Order[]
    getOrderById: (id: string) => Order | undefined
}

// ─── Store ──────────────────────────────────────────────────────────────────
export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [],
    selectedOrderId: null,
    isLoading: false,

    fetchOrders: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id, product_id, product_name, quantity, price, notes
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error

            if (data) {
                const mappedOrders: Order[] = data.map((o: any) => ({
                    id: o.id,
                    type: o.order_type as OrderType,
                    status: o.status as OrderStatus,
                    items: o.order_items.map((i: any) => ({
                        id: i.id,
                        name: i.product_name,
                        quantity: i.quantity,
                        price: i.price,
                        notes: i.notes,
                        productId: i.product_id
                    })),
                    table: o.table_no,
                    guestCount: o.guest_count,
                    createdAt: o.created_at,
                    subtotal: o.subtotal,
                    discount: o.discount,
                    tax: o.tax,
                    total: o.total_amount,
                    kitchenNotes: o.kitchen_notes,
                    payment: o.payment_method ? {
                        method: o.payment_method,
                        status: o.payment_status || 'Approved',
                        transactionId: '',
                        icon: 'payments'
                    } : undefined
                }))
                set({ orders: mappedOrders })
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            customToast.error('Gagal mengambil data pesanan')
        } finally {
            set({ isLoading: false })
        }
    },

    subscribeToOrders: () => {
        const fetchOrder = async (id: string) => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .eq('id', id)
                .single()

            if (data && !error) {
                const newOrder: Order = {
                    id: data.id,
                    type: data.order_type as OrderType,
                    status: data.status as OrderStatus,
                    items: data.order_items.map((i: any) => ({
                        id: i.id,
                        name: i.product_name,
                        quantity: i.quantity,
                        price: i.price,
                        notes: i.notes,
                        productId: i.product_id
                    })),
                    table: data.table_no,
                    guestCount: data.guest_count,
                    createdAt: data.created_at,
                    subtotal: data.subtotal,
                    discount: data.discount,
                    tax: data.tax,
                    total: data.total_amount,
                    kitchenNotes: data.kitchen_notes,
                    payment: data.payment_method ? {
                        method: data.payment_method,
                        status: data.payment_status || 'Approved',
                        transactionId: '',
                        icon: 'payments'
                    } : undefined
                }

                set(state => {
                    const exists = state.orders.find(o => o.id === newOrder.id)
                    if (exists) {
                        return { orders: state.orders.map(o => o.id === newOrder.id ? newOrder : o) }
                    }
                    return { orders: [newOrder, ...state.orders] }
                })
            }
        }

        supabase
            .channel('orders-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTimeout(() => fetchOrder(payload.new.id), 1000)
                    } else if (payload.eventType === 'UPDATE') {
                        set(state => ({
                            orders: state.orders.map(o =>
                                o.id === payload.new.id
                                    ? { ...o, status: payload.new.status }
                                    : o
                            )
                        }))
                        fetchOrder(payload.new.id)
                    }
                }
            )
            .subscribe()
    },

    unsubscribeFromOrders: () => {
        supabase.removeAllChannels()
    },

    addOrder: async (orderData) => {
        try {
            // Generate daily order number: NF-YYMMDD-###
            const now = new Date()
            const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart)

            const orderNum = `NF-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    table_no: orderData.table,
                    order_type: orderData.type,
                    status: 'waiting',
                    guest_count: orderData.guestCount || 1,
                    subtotal: orderData.subtotal,
                    tax: orderData.tax,
                    discount: orderData.discount,
                    total_amount: orderData.total,
                    payment_method: orderData.payment?.method,
                    kitchen_notes: orderData.kitchenNotes,
                    order_number: orderNum
                })
                .select()
                .single()

            if (orderError) throw orderError

            if (orderData.items && orderData.items.length > 0) {
                const itemsToInsert = orderData.items.map(item => ({
                    order_id: order.id,
                    product_id: item.productId,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes
                }))

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert)

                if (itemsError) throw itemsError
            }

            return order.id

        } catch (error) {
            console.error('Error creating order:', error)
            customToast.error('Gagal membuat pesanan')
            return null
        }
    },

    updateStatus: async (id, status) => {
        set((state) => ({
            orders: state.orders.map((o) =>
                o.id === id ? { ...o, status } : o
            ),
        }))

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', id)

            if (error) throw error

            // NOTE: Stock deduction is now handled by Supabase Database Triggers
            // See: supabase_schema_v3_triggers.sql

        } catch (error) {
            console.error('Failed to update status:', error)
            customToast.error('Gagal update status')
            // Revert optimistic update
            set((state) => ({
                orders: state.orders.map((o) =>
                    o.id === id ? { ...o, status: 'ready' } : o
                ),
            }))
        }
    },

    selectOrder: (id) => set({ selectedOrderId: id }),

    getActiveOrders: () =>
        get().orders.filter(o => ['waiting', 'cooking', 'ready'].includes(o.status)),

    getCompletedOrders: () =>
        get().orders.filter(o => ['completed', 'refunded', 'cancelled'].includes(o.status)),

    getOrderById: (id) => get().orders.find(o => o.id === id),
}))
