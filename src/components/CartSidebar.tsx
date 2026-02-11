import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { Trash2, Plus, Minus, User, ChevronDown, Banknote, QrCode, ArrowRight, UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

interface OrderMeta {
    type: OrderType
    table?: string
    customerName?: string
    customerPhone?: string
}

const ORDER_TYPES = [
    { value: 'dine-in' as const, label: 'Dine In', icon: UtensilsCrossed, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'takeaway' as const, label: 'Take Away', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'delivery' as const, label: 'Delivery', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

export function CartSidebar({ onCheckout }: { onCheckout?: (meta: OrderMeta) => void }) {
    const { items, updateQuantity, total, clearCart } = useCartStore()
    const cartTotal = total()
    const tax = cartTotal * 0.1
    const grandTotal = cartTotal + tax

    const [orderType, setOrderType] = useState<OrderType>('dine-in')
    const [tableNumber, setTableNumber] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)

    const currentType = ORDER_TYPES.find(t => t.value === orderType)!

    const handleCheckout = () => {
        const meta: OrderMeta = {
            type: orderType,
            table: orderType === 'dine-in' ? tableNumber : undefined,
            customerName: orderType === 'delivery' ? customerName : undefined,
            customerPhone: orderType === 'delivery' ? customerPhone : undefined,
        }
        onCheckout?.(meta)
    }

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Current Order</h2>
                        <span className="text-xs text-slate-400 font-medium">Pesanan Baru</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium text-slate-600 dark:text-slate-300">Cart Empty</p>
                    <p className="text-sm mt-1">Select items to start an order.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl shrink-0">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Current Order</h2>
                    <span className="text-xs text-slate-400 font-medium">{items.length} item(s)</span>
                </div>
                <button
                    onClick={() => clearCart()}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Clear All"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Order Type Selector */}
            <div className="px-6 py-4 shrink-0">
                <div className="relative">
                    <button
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            currentType.color
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                            <currentType.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold">{currentType.label}</p>
                            <p className="text-xs opacity-70">
                                {orderType === 'dine-in' && (tableNumber ? `Meja ${tableNumber}` : 'Pilih meja')}
                                {orderType === 'takeaway' && 'Bawa pulang'}
                                {orderType === 'delivery' && (customerName || 'Info pengiriman')}
                            </p>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showTypeDropdown && "rotate-180")} />
                    </button>

                    {showTypeDropdown && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowTypeDropdown(false)} />
                            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                                {ORDER_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => { setOrderType(t.value); setShowTypeDropdown(false) }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors",
                                            orderType === t.value && "bg-primary/5 font-bold"
                                        )}
                                    >
                                        <t.icon className="w-4 h-4" />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Contextual Input */}
                {orderType === 'dine-in' && (
                    <input
                        className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Nomor Meja (e.g. 4)"
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                    />
                )}
                {orderType === 'delivery' && (
                    <div className="mt-2 space-y-2">
                        <input
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Nama pelanggan"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                        <input
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="No. HP (e.g. 08123...)"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
                {items.map((item) => (
                    <div key={item.id + item.notes} className="flex gap-4 group">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{item.name}</h4>
                                <span className="font-bold text-slate-800 dark:text-white text-sm">
                                    {formatRupiah(item.price * item.quantity)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2 min-h-[1.25rem]">
                                {item.notes && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-slate-400 max-w-full truncate">
                                        {item.notes}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-md p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-6 h-6 rounded bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-6 h-6 rounded bg-primary text-white shadow-sm flex items-center justify-center hover:bg-orange-600 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 p-6 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-10 shrink-0">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                        <span>Subtotal</span>
                        <span>{formatRupiah(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                        <span>Tax (10%)</span>
                        <span>{formatRupiah(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-zinc-700 mt-2">
                        <span className="text-slate-800 dark:text-white font-bold text-lg">Total</span>
                        <span className="text-primary font-bold text-2xl">
                            {formatRupiah(grandTotal)}
                        </span>
                    </div>
                </div>

                {/* Payment Methods — Only functional ones */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button className="border border-primary bg-primary/5 rounded-lg py-2.5 text-xs font-medium text-primary transition-colors flex flex-col items-center justify-center gap-1">
                        <Banknote className="w-5 h-5" />
                        Cash
                    </button>
                    <button className="border border-slate-200 dark:border-zinc-700 rounded-lg py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 group">
                        <QrCode className="w-5 h-5 group-hover:text-primary" />
                        QRIS
                    </button>
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    Bayar {formatRupiah(grandTotal)}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}
