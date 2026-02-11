import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportToCSV } from '@/lib/exportCSV'
import { Clock, AlertTriangle, CheckCircle2, Download, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface ShiftRecord {
    id: string
    start_time: string
    end_time: string | null
    start_cash: number
    end_cash_system: number
    end_cash_actual: number
    difference: number
    status: string
    notes: string | null
    staff_id: string | null
}

export default function ShiftHistory() {
    const [shifts, setShifts] = useState<ShiftRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'discrepancy' | 'ok'>('all')

    useEffect(() => {
        fetchShifts()
    }, [])

    const fetchShifts = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('status', 'closed')
                .order('end_time', { ascending: false })
                .limit(100)

            if (error) throw error
            setShifts(data || [])
        } catch (err) {
            console.error('Error fetching shifts:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredShifts = shifts.filter(s => {
        if (filter === 'discrepancy') return s.difference !== 0
        if (filter === 'ok') return s.difference === 0
        return true
    })

    const totalVariance = shifts.reduce((acc, s) => acc + (s.difference || 0), 0)
    const discrepancyCount = shifts.filter(s => s.difference !== 0).length

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Shift</h1>
                        <p className="text-sm text-gray-500">{shifts.length} shift tercatat</p>
                    </div>
                </div>
                <button
                    onClick={() => exportToCSV(shifts.map(s => ({
                        tanggal: new Date(s.start_time).toLocaleDateString('id-ID'),
                        mulai: new Date(s.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        selesai: s.end_time ? new Date(s.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
                        kas_awal: s.start_cash,
                        kas_sistem: s.end_cash_system,
                        kas_aktual: s.end_cash_actual,
                        selisih: s.difference,
                        catatan: s.notes || ''
                    })), 'riwayat_shift')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Shift</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shifts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Shift Bermasalah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", discrepancyCount > 0 ? "text-red-500" : "text-green-500")}>
                            {discrepancyCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Selisih</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", totalVariance < 0 ? "text-red-500" : totalVariance > 0 ? "text-yellow-500" : "text-green-500")}>
                            {formatRupiah(totalVariance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {([['all', 'Semua'], ['discrepancy', 'Selisih'], ['ok', 'Cocok']] as const).map(([key, label]) => (
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

            {/* Shifts Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                    <th className="px-4 py-3 text-left font-medium">Waktu</th>
                                    <th className="px-4 py-3 text-right font-medium">Kas Awal</th>
                                    <th className="px-4 py-3 text-right font-medium">Kas Sistem</th>
                                    <th className="px-4 py-3 text-right font-medium">Kas Aktual</th>
                                    <th className="px-4 py-3 text-right font-medium">Selisih</th>
                                    <th className="px-4 py-3 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShifts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            Belum ada data shift
                                        </td>
                                    </tr>
                                ) : (
                                    filteredShifts.map((s) => (
                                        <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                {new Date(s.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(s.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    {' → '}
                                                    {s.end_time ? new Date(s.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{formatRupiah(s.start_cash)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatRupiah(s.end_cash_system)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatRupiah(s.end_cash_actual)}</td>
                                            <td className={cn(
                                                "px-4 py-3 text-right font-mono font-semibold",
                                                s.difference < 0 ? "text-red-500" : s.difference > 0 ? "text-yellow-600" : "text-green-500"
                                            )}>
                                                {s.difference > 0 ? '+' : ''}{formatRupiah(s.difference)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {s.difference === 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                                        <CheckCircle2 className="h-3 w-3" /> Cocok
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                                        <AlertTriangle className="h-3 w-3" /> Selisih
                                                    </span>
                                                )}
                                            </td>
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
