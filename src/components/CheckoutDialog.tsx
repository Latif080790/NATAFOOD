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
import type { OrderType } from '@/components/CartSidebar'

interface OrderMeta {
    type: OrderType
    table?: string
    customerName?: string
    customerPhone?: string
}

interface CheckoutDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    orderMeta?: OrderMeta
}

export function CheckoutDialog({ isOpen, onClose, onSuccess, orderMeta }: CheckoutDialogProps) {
    const { items, total, clearCart } = useCartStore()
    const addOrder = useOrderStore((s) => s.addOrder)
    const [method, setMethod] = useState<'qris' | 'cash' | null>(null)
    const [processing, setProcessing] = useState(false)
    const [successOrder, setSuccessOrder] = useState<Order | null>(null)
    const [cashReceived, setCashReceived] = useState('')
    const cartTotal = total()

    const receiptRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${successOrder?.id || 'NewOrder'}`,
    })

    const grandTotal = cartTotal + (cartTotal * 0.1) // with 10% tax
    const cashAmount = Number(cashReceived) || 0
    const changeAmount = cashAmount - grandTotal

    const quickCashAmounts = [
        grandTotal, // Uang Pas
        Math.ceil(grandTotal / 10000) * 10000, // nearest 10k
        Math.ceil(grandTotal / 50000) * 50000, // nearest 50k
        Math.ceil(grandTotal / 100000) * 100000, // nearest 100k
    ].filter((v, i, a) => a.indexOf(v) === i) // dedupe

    const handlePay = async () => {
        if (!method || items.length === 0) return
        if (method === 'cash' && cashAmount < grandTotal) {
            toast.error('Uang yang diterima kurang!')
            return
        }
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
            type: orderMeta?.type || 'dine-in',
            status: 'completed',
            items: orderItems,
            subtotal,
            discount,
            tax,
            total: orderTotal,
            table: orderMeta?.type === 'dine-in' ? orderMeta.table : undefined,
            customer: orderMeta?.type === 'delivery' ? {
                name: orderMeta.customerName || 'Customer',
                phone: orderMeta.customerPhone || '',
                initials: (orderMeta.customerName || 'C')[0].toUpperCase(),
            } : undefined,
            payment: {
                method: method === 'qris' ? 'QRIS' : 'Cash',
                icon: method === 'qris' ? 'qr_code_2' : 'payments',
                transactionId: `TX_${Date.now()}`,
                status: 'Approved',
                cashReceived: method === 'cash' ? cashAmount : undefined,
                change: method === 'cash' ? changeAmount : undefined,
            },
            createdAt: new Date().toISOString(),
            guestCount: 1
        }

        // Create real order in the unified store
        const orderId = await addOrder(newOrderData)

        if (orderId) {
            setSuccessOrder({ ...newOrderData, id: orderId } as Order)
            setProcessing(false)
            toast.success(`Pembayaran Berhasil!`)
        } else {
            setProcessing(false)
        }
    }

    const handleFinish = () => {
        clearCart()
        setSuccessOrder(null)
        setMethod(null)
        setCashReceived('')
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
                        {successOrder.payment?.method === 'Cash' && successOrder.payment.change !== undefined && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm text-gray-500">Diterima: <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(successOrder.payment.cashReceived || 0)}</span></p>
                                <p className="text-lg font-bold text-green-600">Kembalian: {formatRupiah(successOrder.payment.change)}</p>
                            </div>
                        )}
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
                            {formatRupiah(grandTotal)}
                        </div>
                        {orderMeta && (
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                                {orderMeta.type === 'dine-in' && `Dine In${orderMeta.table ? ` • Meja ${orderMeta.table}` : ''}`}
                                {orderMeta.type === 'takeaway' && 'Take Away'}
                                {orderMeta.type === 'delivery' && `Delivery${orderMeta.customerName ? ` • ${orderMeta.customerName}` : ''}`}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant={method === 'qris' ? 'default' : 'outline'}
                            className="h-24 flex flex-col gap-2 text-lg"
                            onClick={() => { setMethod('qris'); setCashReceived('') }}
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

                    {/* Cash Calculator */}
                    {method === 'cash' && (
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uang Diterima (Rp)</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 px-4 py-3 text-xl font-bold text-center focus:ring-2 focus:ring-primary/50 outline-none"
                                value={cashReceived}
                                onChange={e => setCashReceived(e.target.value)}
                                placeholder="0"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                {quickCashAmounts.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCashReceived(String(q))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${cashAmount === q
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary'
                                            }`}
                                    >
                                        {q >= 1000 ? `${(q / 1000).toFixed(0)}K` : q}
                                    </button>
                                ))}
                            </div>
                            {cashAmount > 0 && (
                                <div className={`text-center p-2 rounded-lg ${changeAmount >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                    <p className="text-xs text-gray-500">Kembalian</p>
                                    <p className={`text-2xl font-bold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {changeAmount >= 0 ? formatRupiah(changeAmount) : `Kurang ${formatRupiah(Math.abs(changeAmount))}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="w-full text-xl font-bold h-14"
                        disabled={!method || processing || (method === 'cash' && cashAmount < grandTotal)}
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
