import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, User, FileText, ChevronRight, CheckCircle2 } from 'lucide-react'

interface Adjustment {
    id: string
    check_date: string
    staff_id: string
    notes: string
    status: string
    items_count?: number
    profiles?: { full_name: string }
}

export default function StockOpname() {
    const navigate = useNavigate()
    const [history, setHistory] = useState<Adjustment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('inventory_adjustments')
                .select(`
                    *,
                    profiles:staff_id (full_name),
                    inventory_adjustment_items (count)
                `)
                .order('check_date', { ascending: false })

            if (error) throw error

            setHistory(data.map((d: any) => ({
                ...d,
                items_count: d.inventory_adjustment_items?.[0]?.count || 0
            })))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#23170f]">
            {/* Header */}
            <header className="bg-white dark:bg-[#2d2018] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inventory')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Stock Opname History</h1>
                        <p className="text-xs text-gray-500">Inventory Adjustment Log</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/inventory/opname/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">New Check</span>
                </button>
            </header>

            <main className="p-6 max-w-4xl mx-auto space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#2d2018] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No history yet</h3>
                        <p className="text-gray-500 mb-6">Start your first stock opname to track inventory accuracy.</p>
                        <button
                            onClick={() => navigate('/inventory/opname/new')}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 font-medium"
                        >
                            Start Now
                        </button>
                    </div>
                ) : (
                    history.map((item: Adjustment) => (
                        <div key={item.id} className="bg-white dark:bg-[#2d2018] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {new Date(item.check_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Completed
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" />
                                            {item.profiles?.full_name || 'Unknown Staff'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5" />
                                            {item.items_count} items checked
                                        </span>
                                    </div>
                                    {item.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-2">
                                            "{item.notes}"
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    )
}
