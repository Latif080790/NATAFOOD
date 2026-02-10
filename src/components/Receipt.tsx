import { forwardRef } from 'react'
import { formatRupiah } from '@/lib/format'
import { type Order } from '@/store/orderStore'
import { useSettingsStore } from '@/store/settingsStore'

interface ReceiptProps {
    order: Order
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
    const settings = useSettingsStore()

    return (
        <div ref={ref} className="hidden print:block font-mono text-xs p-2 leading-tight w-[80mm] mx-auto">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="font-bold text-lg mb-1">{settings.storeName || 'NataFood POS'}</h2>
                <div className="text-[10px] space-y-0.5">
                    <p>{settings.storeAddress || 'Jl. Raya NataFood No. 1'}</p>
                    <p>{settings.storePhone || '0812-3456-7890'}</p>
                </div>
            </div>

            {/* Order Info */}
            <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
                <div className="flex justify-between">
                    <span>Order #{order.id.slice(0, 8)}</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                {order.customer && <p>Cust: {order.customer.name}</p>}
                {order.table && <p>Table: {order.table}</p>}
                <p>Type: {order.type} ({order.payment?.method || 'Cash'})</p>
                {order.payment?.transactionId && <p>Ref: {order.payment.transactionId}</p>}
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between font-bold">
                            <span>{item.name}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>{item.quantity} x {formatRupiah(item.price)}</span>
                            <span>{formatRupiah(item.quantity * item.price)}</span>
                        </div>
                        {item.notes && <p className="text-[10px] italic ml-2">- {item.notes}</p>}
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-black pt-2 space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>-{formatRupiah(order.discount)}</span>
                    </div>
                )}
                {order.tax > 0 && (
                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatRupiah(order.tax)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-dotted border-black pt-2 mt-1">
                    <span>TOTAL</span>
                    <span>{formatRupiah(order.total)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] mt-4">
                <p>Terima Kasih atas Kunjungan Anda!</p>
                <p>Silakan Datang Kembali</p>
                <p className="mt-2 text-[8px] text-gray-400">Powered by NataFood POS</p>
            </div>
        </div>
    )
})

Receipt.displayName = 'Receipt'
