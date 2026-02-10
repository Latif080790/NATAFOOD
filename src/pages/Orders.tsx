import { useOrderStore, type Order } from '@/store/orderStore'
import { formatRupiah, formatDate, formatTime12h } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
    Clock, CreditCard, Mail, Printer, FileText,
    ChevronRight, Search, Phone, ArrowLeft
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/store/toastStore'

type FilterTab = 'all' | 'completed' | 'refunded'

export default function Orders() {
    const { orders, selectedOrderId, selectOrder } = useOrderStore()
    const [filter, setFilter] = useState<FilterTab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileDetailId, setMobileDetailId] = useState<string | null>(null)

    // Filter to completed/refunded orders (order history)
    const historyOrders = orders.filter(o => ['completed', 'refunded'].includes(o.status))

    const filteredOrders = historyOrders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter
        const matchesSearch = searchQuery === '' ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            o.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const selectedOrder = orders.find(o => o.id === selectedOrderId)
    const mobileDetailOrder = orders.find(o => o.id === mobileDetailId)

    const TABS: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: 'Semua', count: historyOrders.length },
        { key: 'completed', label: 'Selesai', count: historyOrders.filter(o => o.status === 'completed').length },
        { key: 'refunded', label: 'Refunded', count: historyOrders.filter(o => o.status === 'refunded').length },
    ]

    const handleMobileSelect = (id: string) => {
        setMobileDetailId(id)
        selectOrder(id)
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex overflow-hidden">
            {/* ─── Mobile: Full-screen Detail View ─── */}
            {mobileDetailOrder && (
                <div className="md:hidden fixed inset-0 z-50 bg-background overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setMobileDetailId(null)}
                            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                            aria-label="Back to list"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="font-bold text-sm">{mobileDetailOrder.id}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(mobileDetailOrder.createdAt)}</p>
                        </div>
                    </div>
                    <OrderDetail order={mobileDetailOrder} />
                </div>
            )}

            {/* ─── Left Panel: Order List ─── */}
            <div className="w-full md:w-[380px] lg:w-[420px] md:border-r border-border flex flex-col shrink-0 bg-white dark:bg-zinc-900">
                {/* Header */}
                <div className="p-4 pb-3 border-b border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg md:text-xl font-bold text-foreground">Riwayat Pesanan</h1>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-medium">
                            {historyOrders.length} orders
                        </span>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari order, customer..."
                            className="pl-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filter Tabs */}
                    <div className="flex gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                                    filter === tab.key
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Order List */}
                <div className="flex-1 overflow-y-auto divide-y divide-border pb-20 md:pb-0">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <FileText className="w-12 h-12 mb-3 opacity-40" />
                            <p className="font-medium">Tidak ada pesanan</p>
                            <p className="text-xs">Coba ubah filter atau kata kunci.</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <OrderListItem
                                key={order.id}
                                order={order}
                                isSelected={selectedOrderId === order.id}
                                onClick={() => {
                                    selectOrder(order.id)
                                    handleMobileSelect(order.id)
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ─── Desktop Right Panel: Order Detail ─── */}
            <div className="hidden md:flex flex-1 flex-col bg-muted/30 overflow-y-auto">
                {selectedOrder ? (
                    <OrderDetail order={selectedOrder} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">Pilih pesanan</p>
                        <p className="text-sm">Klik salah satu pesanan di panel kiri untuk melihat detail.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Order List Item ────────────────────────────────────────────────────────
function OrderListItem({ order, isSelected, onClick }: {
    order: Order
    isSelected: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/60 min-h-[64px]",
                isSelected && "bg-primary/5 border-l-4 border-l-primary"
            )}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">{order.id}</span>
                    <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-bold rounded uppercase",
                        order.status === 'completed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {order.status}
                    </span>
                    <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium rounded capitalize",
                        order.type === 'dine-in' ? "bg-blue-50 text-blue-600" :
                            order.type === 'delivery' ? "bg-purple-50 text-purple-600" :
                                "bg-amber-50 text-amber-600"
                    )}>
                        {order.type}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="font-bold text-sm">{formatRupiah(order.total)}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime12h(order.createdAt)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
    )
}

// ─── Order Detail ───────────────────────────────────────────────────────────
function OrderDetail({ order }: { order: Order }) {
    return (
        <div className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-5 md:space-y-6 pb-24 md:pb-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold">{order.id}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)} • {formatTime12h(order.createdAt)}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <span className={cn(
                        "px-2 py-1 text-xs font-bold rounded-lg uppercase",
                        order.status === 'completed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {order.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-lg bg-muted capitalize">
                        {order.type} {order.table && `• ${order.table}`}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm overflow-hidden">
                {/* Desktop header */}
                <div className="hidden md:grid p-4 border-b font-bold text-sm text-muted-foreground grid-cols-12">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Harga</span>
                    <span className="col-span-2 text-right">Total</span>
                </div>
                {order.items.map((item, idx) => (
                    <div key={idx} className="p-4 border-b last:border-b-0">
                        {/* Desktop row */}
                        <div className="hidden md:grid grid-cols-12 items-center text-sm">
                            <div className="col-span-6">
                                <p className="font-medium">{item.name}</p>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                            </div>
                            <span className="col-span-2 text-center text-muted-foreground">{item.quantity}</span>
                            <span className="col-span-2 text-right text-muted-foreground">{formatRupiah(item.price)}</span>
                            <span className="col-span-2 text-right font-medium">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                        {/* Mobile row */}
                        <div className="md:hidden flex justify-between items-start text-sm">
                            <div className="flex-1">
                                <p className="font-medium">{item.quantity}x {item.name}</p>
                                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            </div>
                            <span className="font-medium shrink-0 ml-4">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                    </div>
                ))}
                {/* Totals */}
                <div className="p-4 bg-muted/50 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatRupiah(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Diskon {order.discountLabel || ''}</span>
                            <span>-{formatRupiah(order.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">PPN (8%)</span>
                        <span>{formatRupiah(order.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-primary">{formatRupiah(order.total)}</span>
                    </div>
                </div>
            </div>

            {/* Customer + Payment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.customer && (
                    <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm p-4 space-y-3">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Customer</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {order.customer.initials}
                            </div>
                            <div>
                                <p className="font-bold">{order.customer.name}</p>
                                <p className="text-xs text-muted-foreground">Member since {order.customer.memberSince}</p>
                            </div>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{order.customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate">{order.customer.email}</span>
                            </div>
                        </div>
                    </div>
                )}
                {order.payment && (
                    <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm p-4 space-y-3">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Pembayaran</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">{order.payment.method}</p>
                                <p className="text-xs text-muted-foreground truncate">{order.payment.transactionId}</p>
                            </div>
                        </div>
                        <span className={cn(
                            "inline-block px-2 py-1 text-xs font-bold rounded",
                            order.payment.status === 'Approved' ? "bg-green-100 text-green-700" :
                                order.payment.status === 'Refunded' ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                        )}>
                            {order.payment.status}
                        </span>
                    </div>
                )}
            </div>

            {/* Kitchen Notes */}
            {order.kitchenNotes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">Catatan Dapur</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{order.kitchenNotes}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    variant="outline" className="flex-1"
                    onClick={() => toast.info('Email receipt sent!')}
                >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                </Button>
                <Button
                    variant="outline" className="flex-1"
                    onClick={() => toast.info('Receipt reprinted!')}
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Ulang
                </Button>
            </div>
        </div>
    )
}
