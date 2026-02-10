import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useOrderStore, calculateOrderTotals, type OrderItem } from '@/store/orderStore'
import { toast } from '@/store/toastStore'
import { formatRupiah } from '@/lib/format'
import { useState } from 'react'

interface CheckoutDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CheckoutDialog({ isOpen, onClose, onSuccess }: CheckoutDialogProps) {
    const { items, total, clearCart } = useCartStore()
    const addOrder = useOrderStore((s) => s.addOrder)
    const [method, setMethod] = useState<'qris' | 'cash' | null>(null)
    const [processing, setProcessing] = useState(false)
    const cartTotal = total()

    const handlePay = () => {
        if (!method || items.length === 0) return
        setProcessing(true)

        // Convert cart items to order items
        const orderItems: OrderItem[] = items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes,
        }))

        const { subtotal, discount, tax, total: orderTotal } = calculateOrderTotals(orderItems)

        // Create real order in the unified store
        const orderId = addOrder({
            type: 'dine-in',
            items: orderItems,
            subtotal,
            discount,
            tax,
            total: orderTotal,
            payment: {
                method: method === 'qris' ? 'QRIS' : 'Cash',
                icon: method === 'qris' ? 'qr_code_2' : 'payments',
                transactionId: `TX_${Date.now()}`,
                status: 'Approved',
            },
        })

        // Simulate brief processing
        setTimeout(() => {
            clearCart()
            setProcessing(false)
            setMethod(null)
            toast.success(`Order ${orderId} berhasil dibuat!`)
            onSuccess()
        }, 800)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Checkout">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-muted-foreground">Total Tagihan</p>
                    <div className="text-4xl font-bold text-primary">
                        {formatRupiah(cartTotal)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant={method === 'qris' ? 'default' : 'outline'}
                        className="h-24 flex flex-col gap-2 text-lg"
                        onClick={() => setMethod('qris')}
                    >
                        <QrCode className="h-8 w-8" />
                        QRIS
                    </Button>
                    <Button
                        variant={method === 'cash' ? 'default' : 'outline'}
                        className="h-24 flex flex-col gap-2 text-lg"
                        onClick={() => setMethod('cash')}
                    >
                        <Banknote className="h-8 w-8" />
                        Tunai
                    </Button>
                </div>

                <Button
                    size="lg"
                    className="w-full text-xl font-bold h-14"
                    disabled={!method || processing}
                    onClick={handlePay}
                >
                    {processing ? 'Memproses...' : 'Bayar Sekarang'}
                </Button>
            </div>
        </Modal>
    )
}
