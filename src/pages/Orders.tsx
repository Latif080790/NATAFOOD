import { useState } from 'react'
import { useOrderHistoryStore, type OrderRecord } from '@/store/orderHistoryStore'
import { cn } from '@/lib/utils'
import { Search, Mail, Printer, Phone, CreditCard, FileText, User, Wallet, QrCode, Banknote } from 'lucide-react'

const STATUS_FILTERS = ['All', 'Completed', 'Refunded'] as const

function formatRupiah(amount: number) {
    return 'Rp ' + amount.toLocaleString('id-ID')
}

function getStatusBadge(status: OrderRecord['status']) {
    switch (status) {
        case 'paid':
            return { label: 'Paid', bg: 'bg-primary/10 text-primary border-primary/20' }
        case 'completed':
            return { label: 'Completed', bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' }
        case 'refunded':
            return { label: 'Refunded', bg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' }
    }
}

function getOrderLabel(order: OrderRecord) {
    if (order.type === 'dine-in' && order.table) return `Dine In • ${order.table}`
    if (order.type === 'takeaway') return 'Takeaway • Counter'
    if (order.type === 'delivery' && order.platform) return `Delivery • ${order.platform}`
    return order.type
}

function getPaymentIcon(iconName: string) {
    switch (iconName) {
        case 'qr_code_2': return <QrCode className="w-4 h-4" />
        case 'payments': return <Banknote className="w-4 h-4" />
        case 'credit_card': return <CreditCard className="w-4 h-4" />
        case 'account_balance_wallet': return <Wallet className="w-4 h-4" />
        default: return <CreditCard className="w-4 h-4" />
    }
}

export default function Orders() {
    const { orders, selectedOrderId, selectOrder } = useOrderHistoryStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('All')

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = statusFilter === 'All' || order.status === statusFilter.toLowerCase()
        return matchesSearch && matchesFilter
    })

    const selectedOrder = orders.find(o => o.id === selectedOrderId)

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-slate-900">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Order History</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">List of today's transactions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            className="pl-10 pr-4 py-2 text-sm rounded-md border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none w-64"
                            placeholder="Search order ID..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content: Master-Detail */}
            <div className="flex flex-1 overflow-hidden">
                {/* Order List (Left Panel) */}
                <div className="w-full md:w-1/3 md:min-w-[320px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Filter Tabs */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex gap-2">
                        {STATUS_FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors border",
                                    statusFilter === filter
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border-transparent"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Order List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredOrders.map(order => {
                            const isSelected = order.id === selectedOrderId
                            const badge = getStatusBadge(order.status)
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => selectOrder(order.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg cursor-pointer transition-all relative",
                                        isSelected
                                            ? "bg-primary/5 dark:bg-primary/10 border border-primary/20 shadow-sm"
                                            : "hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn("font-semibold text-gray-900 dark:text-gray-50", isSelected && "font-bold")}>#{order.id}</span>
                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", badge.bg)}>{badge.label}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400 mb-2">
                                        <span>{getOrderLabel(order)}</span>
                                        <span>{order.time}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500 dark:text-slate-400">{order.items.length} items</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-50">{formatRupiah(order.total)}</span>
                                    </div>
                                    {isSelected && <div className="absolute inset-y-0 right-0 w-1 bg-primary rounded-r-lg" />}
                                </button>
                            )
                        })}
                        {filteredOrders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <FileText className="w-10 h-10 mb-2" />
                                <p className="text-sm font-medium">No orders found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Detail (Right Panel) — Hidden on mobile if no selection */}
                <div className="hidden md:flex flex-1 bg-gray-100 dark:bg-slate-900 overflow-y-auto p-6">
                    {selectedOrder ? (
                        <OrderDetail order={selectedOrder} />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-3" />
                                <p className="text-lg font-medium">Select an order to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function OrderDetail({ order }: { order: OrderRecord }) {
    const badge = getStatusBadge(order.status)

    return (
        <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Order #{order.id}</h2>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-sm font-medium border", badge.bg)}>{badge.label}</span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 flex items-center text-sm gap-1">
                        📅 {order.date} at {order.time}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-md text-sm font-medium text-gray-900 dark:text-gray-50 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <Mail className="w-4 h-4" />
                        Email Receipt
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors shadow-md">
                        <Printer className="w-4 h-4" />
                        Reprint Receipt
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50">Order Details</h3>
                            <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                                {order.table ? `${order.table} • ` : ''}{order.type === 'dine-in' ? 'Dine In' : order.type === 'takeaway' ? 'Takeaway' : `Delivery`}
                            </span>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/30">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Qty</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-50">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-slate-400">{item.qty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-slate-400">{formatRupiah(item.price)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-50 font-medium">{formatRupiah(item.price * item.qty)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-gray-50">{formatRupiah(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">Discount{order.discountLabel ? ` (${order.discountLabel})` : ''}</span>
                                    <span className="font-medium text-red-500 dark:text-red-400">-{formatRupiah(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Tax (8%)</span>
                                <span className="font-medium text-gray-900 dark:text-gray-50">{formatRupiah(order.tax)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-50">Total</span>
                                <span className="text-xl font-bold text-primary">{formatRupiah(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar Cards */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    {order.customer && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Customer
                            </h3>
                            <div className="flex items-center mb-4">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold mr-3 text-sm">
                                    {order.customer.initials}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-50">{order.customer.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Member Since {order.customer.memberSince}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-gray-50">{order.customer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-gray-50">{order.customer.email}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Payment
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Method</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-50 flex items-center gap-1">
                                    {getPaymentIcon(order.payment.icon)} {order.payment.method}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Transaction ID</span>
                                <span className="text-xs font-mono text-gray-900 dark:text-gray-50">{order.payment.transactionId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Status</span>
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded font-medium",
                                    order.payment.status === 'Approved'
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                )}>{order.payment.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Kitchen Notes */}
                    {order.kitchenNotes && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Kitchen Notes
                            </h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-md p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 italic">"{order.kitchenNotes}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
