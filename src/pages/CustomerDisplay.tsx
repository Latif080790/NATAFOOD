import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import type { CartItem } from '@/store/cartStore'
import { ShoppingBag, Star } from 'lucide-react'

// Define the payload structure we expect from the POS
interface CustomerViewPayload {
    items: CartItem[]
    total: number
}

export default function CustomerDisplay() {
    const [cart, setCart] = useState<CustomerViewPayload>({ items: [], total: 0 })
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        // Subscribe to the global 'customer-display' channel
        const channel = supabase.channel('customer-display')

        channel
            .on(
                'broadcast',
                { event: 'cart-update' },
                (payload) => {
                    if (payload.payload) {
                        setCart(payload.payload)
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
            {/* Header / Brand */}
            <div className="h-16 bg-primary flex items-center justify-center shadow-lg">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Star className="fill-white" />
                    NataFood
                </h1>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Item List */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {cart.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="w-40 h-40 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center animate-pulse">
                                <ShoppingBag className="w-20 h-20 opacity-50" />
                            </div>
                            <h2 className="text-2xl font-medium">Selamat Datang!</h2>
                            <p>Silakan pesan di kasir.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-6">Pesanan Anda</h2>
                            {cart.items.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border flex items-center justify-between animate-in slide-in-from-left-4 fade-in duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{item.name}</h3>
                                            {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold">
                                        {formatRupiah(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Totals & Status */}
                <div className="w-[400px] bg-white dark:bg-zinc-900 border-l p-8 flex flex-col justify-between shadow-xl z-10">
                    <div className="space-y-6">
                        {/* Connection Status */}
                        <div className={`text-xs font-mono text-center flex items-center justify-center gap-2 ${isConnected ? 'text-green-500' : 'text-amber-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                            {isConnected ? 'LIVE' : 'CONNECTING...'}
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-4 pt-10">
                            <div className="flex justify-between text-gray-500 text-lg">
                                <span>Total Item</span>
                                <span>{cart.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-lg">
                                <span>Subtotal</span>
                                <span>{formatRupiah(cart.total)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-lg">
                                <span>Pajak (0%)</span>
                                <span>Rp 0</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 text-center space-y-2">
                        <p className="text-gray-500 uppercase tracking-widest text-sm font-semibold">Total Pembayaran</p>
                        <p className="text-5xl font-extrabold text-primary">{formatRupiah(cart.total)}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
