import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportToCSV } from '@/lib/exportCSV'
import { Package, ArrowUp, ArrowDown, Download, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface StockMovement {
    id: string
    created_at: string
    type: string // 'adjustment', 'order_deduction'
    item_name: string
    previous_qty: number
    new_qty: number
    change_qty: number
    reason: string | null
}

export default function StockMovement() {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')

    useEffect(() => {
        fetchMovements()
    }, [])

    const fetchMovements = async () => {
        setLoading(true)
        try {
            // Fetch from inventory_adjustment_items joined with inventory_adjustments
            const { data, error } = await supabase
                .from('inventory_adjustment_items')
                .select(`
                    id,
                    created_at,
                    inventory_id,
                    system_qty,
                    actual_qty,
                    difference,
                    inventory:inventory_id (name),
                    adjustment:adjustment_id (
                        type,
                        notes,
                        created_at
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(200)

            if (error) throw error

            const mapped: StockMovement[] = (data || []).map((item: any) => ({
                id: item.id,
                created_at: item.adjustment?.created_at || item.created_at,
                type: item.difference > 0 ? 'in' : item.difference < 0 ? 'out' : 'neutral',
                item_name: item.inventory?.name || 'Unknown',
                previous_qty: item.system_qty,
                new_qty: item.actual_qty,
                change_qty: item.difference,
                reason: item.adjustment?.notes || 'Stock Opname'
            }))

            setMovements(mapped)
        } catch (err) {
            console.error('Error fetching stock movements:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredMovements = movements.filter(m => {
        if (filter === 'in') return m.change_qty > 0
        if (filter === 'out') return m.change_qty < 0
        return true
    })

    const totalIn = movements.filter(m => m.change_qty > 0).reduce((acc, m) => acc + m.change_qty, 0)
    const totalOut = movements.filter(m => m.change_qty < 0).reduce((acc, m) => acc + Math.abs(m.change_qty), 0)

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/reports" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Stok</h1>
                        <p className="text-sm text-gray-500">Audit trail perubahan stok</p>
                    </div>
                </div>
                <button
                    onClick={() => exportToCSV(movements.map(m => ({
                        tanggal: new Date(m.created_at).toLocaleDateString('id-ID'),
                        barang: m.item_name,
                        stok_sebelumnya: m.previous_qty,
                        stok_baru: m.new_qty,
                        perubahan: m.change_qty,
                        keterangan: m.reason || ''
                    })), 'riwayat_stok')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Perubahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{movements.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500 flex items-center gap-1">
                            <ArrowUp className="h-5 w-5" />
                            +{totalIn}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Keluar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500 flex items-center gap-1">
                            <ArrowDown className="h-5 w-5" />
                            -{totalOut}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {([['all', 'Semua'], ['in', 'Masuk'], ['out', 'Keluar']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            filter === key
                                ? "bg-primary text-white shadow-sm"
                                : "bg-white dark:bg-zinc-800 text-gray-500 hover:text-gray-900 border"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                    <th className="px-4 py-3 text-left font-medium">Barang</th>
                                    <th className="px-4 py-3 text-right font-medium">Stok Sebelumnya</th>
                                    <th className="px-4 py-3 text-right font-medium">Stok Baru</th>
                                    <th className="px-4 py-3 text-right font-medium">Perubahan</th>
                                    <th className="px-4 py-3 text-left font-medium">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                            Belum ada data perubahan stok
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements.map((m) => (
                                        <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-gray-400" />
                                                    {m.item_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{m.previous_qty}</td>
                                            <td className="px-4 py-3 text-right font-mono">{m.new_qty}</td>
                                            <td className={cn(
                                                "px-4 py-3 text-right font-mono font-semibold",
                                                m.change_qty > 0 ? "text-green-500" : m.change_qty < 0 ? "text-red-500" : ""
                                            )}>
                                                {m.change_qty > 0 ? '+' : ''}{m.change_qty}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{m.reason}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
