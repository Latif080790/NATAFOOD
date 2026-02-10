import { useState, useEffect } from 'react'
import { useOrderStore, type KitchenOrder, type OrderStatus } from '@/store/orderStore'
import { cn } from '@/lib/utils'
import { Clock, Play, CheckCircle, RotateCcw, Utensils, AlertTriangle, ChefHat } from 'lucide-react'

// Helper to format duration mm:ss
const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function Kitchen() {
    const { orders, updateStatus } = useOrderStore()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000) // Update every second for timers
        return () => clearInterval(timer)
    }, [])

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('orderId', id)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent, status: OrderStatus) => {
        const id = e.dataTransfer.getData('orderId')
        if (id) {
            updateStatus(id, status)
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col pt-0 bg-background-light dark:bg-[#23170f] overflow-hidden">
            {/* Top Control Bar */}
            <header className="h-16 bg-white dark:bg-[#2c1e14] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <ChefHat className="text-primary w-8 h-8" />
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Kitchen Display</h1>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        ONLINE
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="hidden md:flex items-center gap-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors px-4 py-2 rounded-lg group">
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Batching Summary</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">15 Es Teler, 8 Croffles</span>
                        </div>
                    </button>
                    <div className="text-right">
                        <div className="text-xl font-bold leading-none">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-sm font-medium text-gray-500 ml-1">
                                {currentTime.toLocaleTimeString([], { hour12: true }).slice(-2)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">Dinner Service</div>
                    </div>
                </div>
            </header>

            {/* Main Kanban Board */}
            <main className="flex-1 flex overflow-x-auto overflow-y-hidden p-4 gap-4 h-full">
                {/* WAITING COLUMN */}
                <div
                    className="flex flex-col min-w-[350px] max-w-[400px] flex-1 h-full bg-gray-100/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'waiting')}
                >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5 rounded-t-xl sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                            WAITING
                        </h2>
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-bold">
                            {orders.filter(o => o.status === 'waiting').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {orders.filter(o => o.status === 'waiting').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                currentTime={currentTime}
                                onDragStart={handleDragStart}
                                onAction={() => updateStatus(order.id, 'cooking')}
                                actionLabel="Start Cooking"
                                actionIcon={<Play className="w-5 h-5" />}
                                variant="waiting"
                            />
                        ))}
                    </div>
                </div>

                {/* COOKING COLUMN */}
                <div
                    className="flex flex-col min-w-[350px] max-w-[400px] flex-1 h-full bg-[#fffbeb] dark:bg-amber-900/10 rounded-xl border-2 border-dashed border-[#fcd34d] dark:border-amber-700"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'cooking')}
                >
                    <div className="p-4 border-b border-[#fcd34d] dark:border-amber-800/50 flex justify-between items-center bg-amber-100 dark:bg-amber-900/30 rounded-t-lg sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <Utensils className="w-5 h-5 animate-pulse text-amber-600" />
                            COOKING
                        </h2>
                        <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-3 py-1 rounded-full text-sm font-bold">
                            {orders.filter(o => o.status === 'cooking').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {orders.filter(o => o.status === 'cooking').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                currentTime={currentTime}
                                onDragStart={handleDragStart}
                                onAction={() => updateStatus(order.id, 'ready')}
                                actionLabel="Bump Order"
                                actionIcon={<CheckCircle className="w-5 h-5" />}
                                variant="cooking"
                            />
                        ))}
                    </div>
                </div>

                {/* READY COLUMN */}
                <div
                    className="flex flex-col min-w-[350px] max-w-[400px] flex-1 h-full bg-gray-100/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'ready')}
                >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-green-50 dark:bg-green-900/10 rounded-t-xl sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            READY
                        </h2>
                        <span className="bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-bold">
                            {orders.filter(o => o.status === 'ready').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {orders.filter(o => o.status === 'ready').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                currentTime={currentTime}
                                onDragStart={handleDragStart}
                                onAction={() => updateStatus(order.id, 'waiting')} // Demo recall, could vary
                                actionLabel="Recall"
                                actionIcon={<RotateCcw className="w-5 h-5" />}
                                variant="ready"
                            />
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer Stats / Legend */}
            <footer className="bg-white dark:bg-[#2c1e14] border-t border-gray-200 dark:border-gray-800 py-3 px-6 text-sm flex justify-between items-center shrink-0">
                <div className="flex gap-6 text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span>On Time (&lt; 5m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span>Warning (5-10m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                        <span>Critical (&gt; 10m)</span>
                    </div>
                </div>
                <div className="text-gray-400 text-xs">
                    System v2.4.1 | Station: HOT_KITCHEN_01
                </div>
            </footer>
        </div>
    )
}

function OrderCard({
    order,
    currentTime,
    onDragStart,
    onAction,
    actionLabel,
    actionIcon,
    variant
}: {
    order: KitchenOrder,
    currentTime: Date,
    onDragStart: (e: React.DragEvent, id: string) => void,
    onAction: () => void,
    actionLabel: string,
    actionIcon: React.ReactNode,
    variant: 'waiting' | 'cooking' | 'ready'
}) {
    const elapsedMs = currentTime.getTime() - new Date(order.createdAt).getTime()
    const elapsedMinutes = Math.floor(elapsedMs / 60000)
    const isCritical = elapsedMinutes > 10
    const isWarning = elapsedMinutes > 5 && !isCritical

    return (
        <article
            draggable
            onDragStart={(e) => onDragStart(e, order.id)}
            className={cn(
                "bg-white dark:bg-[#2c1e14] rounded-lg p-5 border-l-8 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative select-none cursor-grab active:cursor-grabbing",
                isCritical && variant === 'cooking' ? "border-l-primary ring-2 ring-red-500/20" : "",
                isWarning && variant === 'cooking' ? "border-l-primary" : "",
                !isCritical && !isWarning && variant === 'cooking' ? "border-l-primary" : "",
                variant === 'waiting' && "border-l-gray-300 dark:border-l-gray-600",
                variant === 'ready' && "border-l-green-500 opacity-90 hover:opacity-100"
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-2xl font-extrabold", variant === 'ready' ? "text-gray-500 line-through" : "text-gray-900 dark:text-white")}>
                            #{order.id}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 text-xs font-bold rounded uppercase",
                            order.type === 'dine-in' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        )}>
                            {order.type}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        {order.table && `${order.table}`}
                        {order.guestCount && ` • ${order.guestCount} Guests`}
                        {order.server && !order.table && `Guest: ${order.server}`}
                        {order.server && order.table && ` • Server: ${order.server}`}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1",
                        isCritical ? "bg-red-500 text-white animate-pulse shadow-lg" :
                            isWarning ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800",
                        variant === 'ready' && "bg-gray-100 text-gray-500 animate-none shadow-none"
                    )}>
                        {isCritical && <AlertTriangle className="w-3 h-3" />}
                        {!isCritical && <Clock className="w-3 h-3" />}
                        {variant === 'ready' ? 'Done' : formatDuration(elapsedMs)}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className={cn(
                "border-y py-3 flex flex-col gap-2",
                variant === 'cooking' ? "bg-amber-50 dark:bg-amber-900/20 -mx-5 px-5 border-amber-100 dark:border-amber-800/30" : "border-gray-100 dark:border-gray-700"
            )}>
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-lg leading-tight">
                        <span className={cn("font-bold", variant === 'ready' ? "text-gray-400" : "text-gray-800 dark:text-gray-200")}>
                            {item.quantity}x {item.name}
                        </span>
                        {item.notes && <span className="text-sm text-red-500 font-bold uppercase mt-1">{item.notes}</span>}
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <button
                onClick={onAction}
                className={cn(
                    "w-full font-bold py-3 rounded-lg text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]",
                    variant === 'waiting' && "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white",
                    variant === 'cooking' && "bg-primary hover:bg-orange-600 text-white shadow-primary/30",
                    variant === 'ready' && "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                )}
            >
                {actionLabel}
                {actionIcon}
            </button>
        </article>
    )
}
