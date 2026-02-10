import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote, CheckCircle2, Printer, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useOrderStore, calculateOrderTotals, type OrderItem, type Order } from '@/store/orderStore'
import { toast } from '@/store/toastStore'
import { formatRupiah } from '@/lib/format'
import { useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Receipt } from '@/components/Receipt'

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
    const [successOrder, setSuccessOrder] = useState<Order | null>(null)
    const cartTotal = total()

    const receiptRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${successOrder?.id || 'NewOrder'}`,
    })

    const handlePay = async () => {
        if (!method || items.length === 0) return
        setProcessing(true)

        // Convert cart items to order items
        const orderItems: OrderItem[] = items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes,
            productId: i.id
        }))

        const { subtotal, discount, tax, total: orderTotal } = calculateOrderTotals(orderItems)

        // Prepare order data
        const newOrderData: Omit<Order, 'id'> = {
            type: 'dine-in', // Default for now
            status: 'completed', // Direct complete for POS
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
            createdAt: new Date().toISOString(),
            guestCount: 1
        }

        // Create real order in the unified store
        const orderId = await addOrder(newOrderData)

        if (orderId) {
            // Success!
            setSuccessOrder({ ...newOrderData, id: orderId } as Order)
            setProcessing(false)
            toast.success(`Pembayaran Berhasil!`)
        } else {
            setProcessing(false)
            // Error toast handled in store
        }
    }

    const handleFinish = () => {
        clearCart()
        setSuccessOrder(null)
        setMethod(null)
        onSuccess()
    }

    const handleClose = () => {
        if (successOrder) {
            handleFinish()
        } else {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={successOrder ? "Pembayaran Berhasil" : "Checkout"}>
            {successOrder ? (
                <div className="space-y-6 text-center py-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Rp {formatRupiah(successOrder.total)}</h2>
                        <p className="text-muted-foreground">Pembayaran via {successOrder.payment?.method} berhasil.</p>
                    </div>

                    {/* Hidden Receipt */}
                    <div style={{ display: 'none' }}>
                        <Receipt ref={receiptRef} order={successOrder} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button variant="outline" size="lg" className="h-12" onClick={() => handlePrint()}>
                            <Printer className="mr-2 h-5 w-5" />
                            Cetak Struk
                        </Button>
                        <Button size="lg" className="h-12" onClick={handleFinish}>
                            Transaksi Baru
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
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
                            disabled={processing}
                        >
                            <QrCode className="h-8 w-8" />
                            QRIS
                        </Button>
                        <Button
                            variant={method === 'cash' ? 'default' : 'outline'}
                            className="h-24 flex flex-col gap-2 text-lg"
                            onClick={() => setMethod('cash')}
                            disabled={processing}
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
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Memproses...
                            </>
                        ) : 'Bayar Sekarang'}
                    </Button>
                </div>
            )}
        </Modal>
    )
}
