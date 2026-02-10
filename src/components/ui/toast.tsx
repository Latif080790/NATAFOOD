import { useToastStore } from '@/store/toastStore'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Info,
}

const STYLES = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
}

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore()

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => {
                const Icon = ICONS[t.variant]
                return (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm animate-in slide-in-from-right-5 fade-in duration-300",
                            STYLES[t.variant]
                        )}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium flex-1">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
