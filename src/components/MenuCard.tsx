import type { MenuItem } from '@/store/cartStore'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MenuCard({ item, onAdd, quantity = 0 }: { item: MenuItem, onAdd: (item: MenuItem) => void, quantity?: number }) {
    const isAvailable = item.status === 'available'
    const isSelected = quantity > 0

    return (
        <div
            onClick={() => isAvailable && onAdd(item)}
            className={cn(
                "bg-white dark:bg-zinc-800 rounded-2xl p-3 shadow-sm border transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col",
                isSelected ? "border-2 border-primary shadow-md" : "border-transparent hover:border-primary/30 hover:shadow-lg",
                !isAvailable && "opacity-75 grayscale cursor-not-allowed"
            )}
        >
            {isSelected && (
                <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md z-10 shadow-md">
                    {quantity}x
                </div>
            )}

            {!isAvailable && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 z-10 rounded-2xl flex items-center justify-center">
                    <div className="bg-slate-800 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                        {item.status === 'sold_out' ? 'Out of Stock' : 'Cooking'}
                    </div>
                </div>
            )}

            <div className="aspect-square rounded-xl overflow-hidden mb-3 relative bg-muted">
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />
            </div>

            <div className="px-1 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{item.category}</p>

                <div className="flex items-center justify-between mt-auto">
                    <span className={cn("font-bold text-lg", isSelected ? "text-primary" : "text-slate-800 dark:text-slate-200")}>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                    </span>
                    <button
                        disabled={!isAvailable}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
                            isSelected ? "bg-primary text-white hover:bg-orange-600" : "bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white"
                        )}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
