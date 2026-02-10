import { useOrderStore, type OrderItem } from '@/store/orderStore'
import { useInventoryStore, type StockItem } from '@/store/inventoryStore'
import {
    Banknote,
    TrendingUp,
    Package,
    Lightbulb,
    PlusCircle,
    UserPlus,
    Download,
    Calendar,
    Bell,
    ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Dashboard() {
    const { orders } = useOrderStore()
    const { stock: inventoryItems } = useInventoryStore()

    // --- Metrics Calculation ---
    const completedOrders = orders.filter(o => o.status === 'completed')

    const totalRevenue = completedOrders.length * 45000 + 1240500
    const revenueDisplay = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalRevenue)

    // Top Selling
    const allItems = orders.flatMap(o => o.items)
    const itemCounts: Record<string, number> = {}
    allItems.forEach((i: OrderItem) => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity })

    const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a)
    const topItem = sortedItems.length > 0 ? { name: sortedItems[0][0], count: sortedItems[0][1] } : { name: 'Strawberry Shortcake', count: 42 }

    // Low Stock
    const lowStockItems = inventoryItems.filter((i: StockItem) => i.currentStock < 10).slice(0, 3)

    // Recent Orders (Take last 3)
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans">
            {/* Header */}
            <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good Morning, Owner! ☕</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's what's happening at <span className="text-primary font-medium">NataFood Cafe</span> today.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Date Picker / Filter */}
                    <div className="hidden md:flex items-center bg-white dark:bg-surface-dark px-3 py-1.5 rounded-lg border border-primary/10 shadow-sm text-sm font-medium text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {/* Notifications */}
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-primary/10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-primary transition-colors shadow-sm relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-surface-dark"></span>
                    </button>
                    {/* Profile */}
                    <div className="hidden sm:flex items-center gap-3 pl-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            AD
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="px-4 md:px-8 pb-12 pt-4 max-w-7xl mx-auto space-y-8">
                {/* Hero Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Card 1: Revenue */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between h-64">
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
                            <span className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-sm font-bold">
                                <TrendingUp className="w-4 h-4 mr-0.5" />
                                12%
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">vs yesterday</span>
                        </div>
                    </div>

                    {/* Card 2: Top Selling Item */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 h-64 flex flex-col relative overflow-hidden group">
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
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Category: <span className="text-gray-800 dark:text-gray-200">Main</span></div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{topItem.count}</span>
                                    <span className="text-sm text-gray-500">units sold</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background gradient blob */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-2xl"></div>
                    </div>

                    {/* Card 3: Stock Health Alert */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-primary/5 hover:border-primary/20 transition-all duration-300 h-64 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Low Stock Alert</h2>
                            <button className="text-xs font-medium text-primary hover:text-primary-dark hover:underline flex items-center">
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
                                        {/* Custom Battery Visual */}
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

                {/* Quick Actions Row */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-4">
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-lg shadow-sm shadow-orange-200 dark:shadow-none transition-all active:scale-95">
                            <PlusCircle className="w-5 h-5" />
                            <span className="font-medium">Add Menu Item</span>
                        </button>
                        <button className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95">
                            <Package className="w-5 h-5 text-primary" />
                            <span className="font-medium">Restock Inventory</span>
                        </button>
                        <button className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95">
                            <UserPlus className="w-5 h-5 text-primary" />
                            <span className="font-medium">Manage Staff</span>
                        </button>
                        <button className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-subtle-dark active:scale-95 ml-auto">
                            <Download className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Secondary Content Grid: Live Orders & Simple Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Orders Feed */}
                    <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                            <a href="#" className="text-sm text-primary hover:underline">View All</a>
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
                                                <td className="py-4 pl-2 font-medium text-gray-900 dark:text-white">#{order.id}</td>
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
                        {/* Abstract Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-xl"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Owner Tip</h3>
                            <p className="text-orange-50 text-sm leading-relaxed">
                                Your "{topItem.name}" sales peak between 2 PM - 4 PM. Consider running a happy hour promo during lunch to boost earlier sales.
                            </p>
                        </div>
                        <button className="relative z-10 mt-6 w-full bg-white text-primary font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-orange-50 transition-colors text-sm">
                            Create Promo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
