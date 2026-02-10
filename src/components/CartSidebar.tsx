import { useCartStore } from '@/store/cartStore'
import { Trash2, Plus, Minus, User, ChevronRight, CreditCard, Banknote, QrCode, MoreHorizontal, ArrowRight } from 'lucide-react'

export function CartSidebar({ onCheckout }: { onCheckout?: () => void }) {
    const { items, updateQuantity, total, clearCart } = useCartStore()
    const cartTotal = total()
    const tax = cartTotal * 0.1
    const grandTotal = cartTotal + tax

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Current Order</h2>
                        <span className="text-xs text-slate-400 font-medium">#Order-{Math.floor(Math.random() * 1000)}</span>
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
                    <span className="text-xs text-slate-400 font-medium">#Order-{Math.floor(Math.random() * 1000)}</span>
                </div>
                <button
                    onClick={() => clearCart()}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Clear All"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Customer Widget */}
            <div className="px-6 py-4 shrink-0">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Walk-in Customer</p>
                        <p className="text-xs text-slate-400">Table 04</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
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
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
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
                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                        <span>Tax (10%)</span>
                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-zinc-700 mt-2">
                        <span className="text-slate-800 dark:text-white font-bold text-lg">Total</span>
                        <span className="text-primary font-bold text-2xl">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}
                        </span>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button className="col-span-1 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 group">
                        <CreditCard className="w-5 h-5 group-hover:text-primary" />
                        Card
                    </button>
                    <button className="col-span-1 border border-primary bg-primary/5 rounded-lg py-2 text-xs font-medium text-primary transition-colors flex flex-col items-center justify-center gap-1">
                        <Banknote className="w-5 h-5" />
                        Cash
                    </button>
                    <button className="col-span-1 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 group">
                        <QrCode className="w-5 h-5 group-hover:text-primary" />
                        QRIS
                    </button>
                    <button className="col-span-1 border border-slate-200 dark:border-zinc-700 rounded-lg py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center gap-1 group">
                        <MoreHorizontal className="w-5 h-5 group-hover:text-primary" />
                        Other
                    </button>
                </div>

                <button
                    onClick={onCheckout}
                    className="w-full bg-primary hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    Bayar {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(grandTotal)}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}
