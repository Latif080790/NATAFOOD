import { useState } from 'react'
import { useInventoryStore, type StockItem } from '@/store/inventoryStore'
import { cn } from '@/lib/utils'
import { Search, Plus, Minus, Package, AlertTriangle, CheckCircle, TrendingDown, MoreVertical } from 'lucide-react'

const CATEGORIES = ['All Ingredients', 'Dairy', 'Dry Goods', 'Fresh', 'Syrups', 'Packaging']

function getStockPercent(item: StockItem) {
    return Math.round((item.currentStock / item.maxStock) * 100)
}

function getStockStatus(item: StockItem): 'good' | 'low' | 'critical' {
    const pct = getStockPercent(item)
    if (pct <= 20) return 'critical'
    if (pct <= 45) return 'low'
    return 'good'
}

export default function Inventory() {
    const { stock, updateStock } = useInventoryStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All Ingredients')

    const filteredStock = stock.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === 'All Ingredients' || item.category === activeCategory
        return matchesSearch && matchesCategory
    })

    const healthyCount = stock.filter(i => getStockStatus(i) === 'good').length
    const lowCount = stock.filter(i => getStockStatus(i) === 'low').length
    const criticalCount = stock.filter(i => getStockStatus(i) === 'critical').length
    const lowStockItems = stock.filter(i => getStockStatus(i) === 'critical' || getStockStatus(i) === 'low')

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col overflow-hidden bg-[#f8f7f5] dark:bg-[#23170f]">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-white dark:bg-[#2d2018] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">Kitchen Inventory</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">NataFood • Main Branch</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-2xl md:mx-12">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            className="w-full bg-[#f8f7f5] dark:bg-[#23170f] border-none rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 text-sm outline-none"
                            placeholder="Search ingredients, SKUs..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5" />
                        <span className="hidden md:inline">Add Item</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area — No Sidebar */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-[#2d2018] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Healthy Stock</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{healthyCount} Items</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#2d2018] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Getting Low</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowCount} Items</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#2d2018] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Critical Stock</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{criticalCount} Items</p>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                                activeCategory === cat
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white dark:bg-[#2d2018] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Inventory Items</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        Sort by: Priority
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20 md:pb-4">
                    {filteredStock.map(item => (
                        <InventoryCard key={item.id} item={item} onUpdate={updateStock} />
                    ))}
                    {filteredStock.length === 0 && (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-gray-400">
                            <Package className="w-10 h-10 mb-2" />
                            <p className="text-lg font-medium">No items found</p>
                            <p className="text-sm">Try a different search or category.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Low Stock Alert — Fixed Bottom Right */}
            {lowStockItems.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 w-72 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white dark:bg-[#2d2018] rounded-xl p-4 shadow-xl border border-red-200 dark:border-red-900/40">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-bold">Low Stock Alert</span>
                            <span className="ml-auto bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
                        </div>
                        <ul className="space-y-2">
                            {lowStockItems.slice(0, 3).map(item => (
                                <li key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                    <span>{item.name}</span>
                                    <span className={cn(
                                        "font-bold",
                                        getStockStatus(item) === 'critical' ? "text-red-500" : "text-yellow-500"
                                    )}>{getStockPercent(item)}%</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-3 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 py-2 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-100 dark:border-red-900/30">
                            Review Order
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function InventoryCard({ item, onUpdate }: { item: StockItem; onUpdate: (id: string, qty: number) => void }) {
    const pct = getStockPercent(item)
    const status = getStockStatus(item)
    const isCritical = status === 'critical'
    const isLow = status === 'low'

    const barColor = isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'
    const statusLabel = isCritical ? `Critical (${pct}%)` : isLow ? `Low (${pct}%)` : `Good (${pct}%)`
    const statusColor = isCritical ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-green-500'

    return (
        <article className={cn(
            "bg-white dark:bg-[#2d2018] rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow group relative overflow-hidden",
            isCritical ? "border-red-200 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/20" : "border-gray-100 dark:border-gray-800"
        )}>
            {/* Left color indicator */}
            <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full",
                isCritical ? "bg-red-500 animate-pulse" : isLow ? "bg-yellow-500" : "bg-green-500"
            )} />

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className={cn(
                        "w-14 h-14 rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden",
                        isCritical ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-800"
                    )}>
                        <img alt={item.name} className="w-full h-full object-cover rounded-md" src={item.image} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.sku} • {item.category}</p>
                    </div>
                </div>
                {isCritical ? (
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce shrink-0" />
                ) : (
                    <button className="text-gray-400 hover:text-primary transition-colors shrink-0">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Visual Level Indicator */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-gray-600 dark:text-gray-300">Stock Level</span>
                    <span className={cn("font-semibold", statusColor)}>{statusLabel}</span>
                </div>
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Tick Marks */}
                    <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/30 z-10" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10" />
                    <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/30 z-10" />
                    {/* Critical striped background */}
                    {isCritical && (
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}
                        />
                    )}
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                </div>
            </div>

            {/* Interactive Controls */}
            <div className={cn(
                "bg-[#f8f7f5] dark:bg-[#23170f] rounded-lg p-3 flex items-center justify-between",
                isCritical && "border border-red-100 dark:border-red-900/30"
            )}>
                <button
                    onClick={() => onUpdate(item.id, item.currentStock - 1)}
                    className="w-10 h-10 rounded-lg bg-white dark:bg-[#2d2018] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
                >
                    <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <span className={cn(
                        "block text-2xl font-bold font-mono",
                        isCritical ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white"
                    )}>
                        {item.currentStock}
                    </span>
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{item.unit}</span>
                </div>
                <button
                    onClick={() => onUpdate(item.id, item.currentStock + 1)}
                    className="w-10 h-10 rounded-lg bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </article>
    )
}
