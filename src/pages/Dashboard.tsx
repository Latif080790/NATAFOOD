import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore, type OrderItem } from '@/store/orderStore'
import { useInventoryStore, type StockItem } from '@/store/inventoryStore'
import { useAuthStore } from '@/store/authStore'
import {
    Banknote,
    Package,
    Lightbulb,
    PlusCircle,
    UserPlus,
    Download,
    Calendar,
    Bell,
    ArrowUpRight,
    TrendingUp,
    Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatDateToLocal } from '@/lib/format'
import { toast } from '@/store/toastStore'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
}

export default function Dashboard() {
    const navigate = useNavigate()
    const { orders, fetchOrders } = useOrderStore()
    const { stock: inventoryItems, fetchStock } = useInventoryStore()
    const user = useAuthStore(s => s.user)

    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        completed: 0,
        cancelled: 0
    })
    const [showNotifications, setShowNotifications] = useState(false)
    const [profitData, setProfitData] = useState({ hpp: 0, grossProfit: 0, margin: 0 })

    const fetchStats = async () => {
        try {
            const { data } = await supabase
                .from('daily_sales_stats')
                .select('*')
                .single()

            if (data) {
                setStats({
                    revenue: data.total_revenue || 0,
                    orders: data.total_orders || 0,
                    completed: data.completed_orders || 0,
                    cancelled: data.cancelled_orders || 0
                })
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    useEffect(() => {
        fetchStats()
        fetchOrders()
        fetchStock()
        // Fetch today's profit data from daily_profit view
        const fetchProfitData = async () => {
            try {
                const today = formatDateToLocal(new Date())
                const { data } = await supabase
                    .from('daily_profit')
                    .select('*')
                    .eq('profit_date', today)
                    .single()
                if (data) {
                    setProfitData({
                        hpp: Number(data.total_hpp) || 0,
                        grossProfit: Number(data.total_gross_profit) || 0,
                        margin: Number(data.avg_margin_percent) || 0
                    })
                }
            } catch {
                // View might not exist yet
            }
        }
        fetchProfitData()
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    const revenueDisplay = formatRupiah(stats.revenue)

    // Top Selling
    const allItems = orders.flatMap(o => o.items)
    const itemCounts: Record<string, number> = {}
    allItems.forEach((i: OrderItem) => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity })
    const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a)
    const topItem = sortedItems.length > 0 ? { name: sortedItems[0][0], count: sortedItems[0][1] } : { name: '-', count: 0 }

    // Low Stock
    const lowStockItems = inventoryItems.filter((i: StockItem) => i.currentStock < 10).slice(0, 3)

    // Recent Orders
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)

    // Export CSV
    const handleExportCSV = () => {
        if (orders.length === 0) {
            toast.error('Tidak ada data pesanan untuk diekspor.')
            return
        }
        const headers = ['Order ID', 'Type', 'Status', 'Items', 'Total', 'Created At']
        const rows = orders.map(o => [
            o.id,
            o.type,
            o.status,
            `"${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}"`,
            o.total,
            new Date(o.createdAt).toLocaleString('id-ID')
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `natafood-orders-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Laporan berhasil diunduh!')
    }

    const userName = user?.email?.split('@')[0] || 'Owner'

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans">
            {/* Header */}
            <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {userName}! ☕</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's what's happening at <span className="text-primary font-medium">NataFood Cafe</span> today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-white dark:bg-surface-dark px-3 py-1.5 rounded-lg border border-primary/10 shadow-sm text-sm font-medium text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        <span>Today, {new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-primary/10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-primary transition-colors shadow-sm relative"
                        >
                            <Bell className="w-5 h-5" />
                            {lowStockItems.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-12 z-40 w-72 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Notifikasi</h4>
                                    {lowStockItems.length === 0 ? (
                                        <p className="text-xs text-gray-400">Tidak ada notifikasi.</p>
                                    ) : (
                                        lowStockItems.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                                <span className="text-gray-600 dark:text-gray-300"><b>{item.name}</b> — Stok kritis ({item.currentStock} {item.unit})</span>
                                            </div>
                                        ))
                                    )}
                                    <button
                                        onClick={() => { setShowNotifications(false); navigate('/inventory') }}
                                        className="w-full text-xs text-primary font-medium pt-2 border-t hover:underline"
                                    >
                                        Lihat Inventory →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Profile */}
                    <div className="hidden sm:flex items-center gap-3 pl-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="px-4 md:px-8 pb-12 pt-4 max-w-7xl mx-auto space-y-8">
                {/* Hero Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Card 1: Revenue */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between min-h-[200px] md:h-64">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Revenue (Omset)</h2>
                                <p className="text-xs text-gray-400 mt-1">Live updates every minute</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <Banknote className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl lg:text-4xl font-extrabold text-primary tracking-tight truncate">
                                    {revenueDisplay}
                                </span>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {stats.completed} pesanan selesai, {stats.cancelled} dibatalkan
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Top Selling Item */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 min-h-[200px] md:h-64 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 z-10">
                            <span className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-primary/10">#1 Bestseller</span>
                        </div>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 z-10 mb-4">Top Selling Item</h2>
                        <div className="flex-1 flex gap-4 items-center z-10">
                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md border-2 border-white dark:border-gray-700 bg-muted flex items-center justify-center text-4xl">
                                🎂
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{topItem.name}</h3>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{topItem.count}</span>
                                    <span className="text-sm text-gray-500">units sold</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-2xl"></div>
                    </div>

                    {/* Card 3: Stock Health Alert */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 min-h-[200px] md:h-64 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Low Stock Alert</h2>
                            <button
                                onClick={() => navigate('/inventory')}
                                className="text-xs font-medium text-primary hover:text-primary-dark hover:underline flex items-center"
                            >
                                View Inventory <ArrowUpRight className="w-3 h-3 ml-1" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-3 scrollbar-hide">
                            {lowStockItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    All stocks are healthy!
                                </div>
                            ) : (
                                lowStockItems.map((item: StockItem) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">📦</div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">{item.name}</p>
                                                <p className="text-xs text-red-500 font-medium">{item.currentStock < 10 ? 'Critical' : 'Low'}</p>
                                            </div>
                                        </div>
                                        <div aria-label="Low battery" className="flex gap-1">
                                            <div className={cn("w-2 h-6 rounded-sm", item.currentStock > 0 ? "bg-red-500" : "bg-gray-200")}></div>
                                            <div className={cn("w-2 h-6 rounded-sm opacity-30", item.currentStock > 10 ? "bg-orange-400" : "bg-gray-200")}></div>
                                            <div className="w-2 h-6 bg-gray-200 dark:bg-gray-700 rounded-sm opacity-30"></div>
                                            <div className="w-2 h-6 bg-gray-200 dark:bg-gray-700 rounded-sm opacity-30"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Profit Indicator */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/10 rounded-xl p-5 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Today's Profit</h3>
                                <p className="text-xs text-gray-500">Revenue - HPP = Gross Profit</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">HPP</p>
                                <p className="text-sm font-bold text-orange-500">{formatRupiah(profitData.hpp)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Gross Profit</p>
                                <p className="text-sm font-bold text-emerald-600">{formatRupiah(profitData.grossProfit)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Margin</p>
                                <p className={cn(
                                    "text-sm font-bold px-2 py-0.5 rounded-full",
                                    profitData.margin >= 30
                                        ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
                                        : profitData.margin >= 15
                                            ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40'
                                            : 'text-red-600 bg-red-100 dark:bg-red-900/40'
                                )}>
                                    {profitData.margin}%
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/hpp')}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                            >
                                <Calculator className="w-3.5 h-3.5" /> Detail HPP
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Row */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigate('/settings')}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-lg shadow-sm shadow-orange-200 dark:shadow-none transition-all active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="font-medium">Add Menu Item</span>
                        </button>
                        <button
                            onClick={() => navigate('/inventory')}
                            className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95"
                        >
                            <Package className="w-5 h-5 text-primary" />
                            <span className="font-medium">Restock Inventory</span>
                        </button>
                        <button
                            onClick={() => navigate('/settings?tab=user')}
                            className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95"
                        >
                            <UserPlus className="w-5 h-5 text-primary" />
                            <span className="font-medium">Manage Staff</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95 ml-auto"
                        >
                            <Download className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Secondary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Orders Feed */}
                    <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                            <button onClick={() => navigate('/orders')} className="text-sm text-primary hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                        <th className="pb-3 pl-2">Order ID</th>
                                        <th className="pb-3">Items</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right pr-2">Start Time</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recentOrders.length === 0 ? (
                                        <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No orders yet.</td></tr>
                                    ) : (
                                        recentOrders.map(order => (
                                            <tr key={order.id} className="group hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors border-b border-gray-5 dark:border-gray-800/50">
                                                <td className="py-4 pl-2 font-medium text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</td>
                                                <td className="py-4 text-gray-600 dark:text-gray-300">
                                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                </td>
                                                <td className="py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        order.status === 'completed' || order.status === 'ready' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                            order.status === 'cooking' ? "bg-orange-100 text-orange-800" :
                                                                "bg-blue-100 text-blue-800"
                                                    )}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right pr-2 font-medium text-gray-900 dark:text-white">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mini Analytics/Tips Card */}
                    <div className="bg-gradient-to-br from-primary to-orange-600 rounded-xl p-6 text-white shadow-lg shadow-orange-200 dark:shadow-none flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-xl"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Owner Tip</h3>
                            <p className="text-orange-50 text-sm leading-relaxed">
                                {topItem.name !== '-'
                                    ? `"${topItem.name}" is your top seller with ${topItem.count} units. Consider running a promo to boost other items.`
                                    : 'Start taking orders to see insights here!'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => toast.info('Fitur Promo akan hadir di versi berikutnya.')}
                            className="relative z-10 mt-6 w-full bg-white text-primary font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-orange-50 transition-colors text-sm"
                        >
                            Create Promo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
