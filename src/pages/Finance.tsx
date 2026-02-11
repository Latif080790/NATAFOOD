import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrderStore } from '@/store/orderStore'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/format'
import { toast } from '@/store/toastStore'
import {
    Banknote, TrendingUp, TrendingDown, Download, Plus, X,
    PieChart, ArrowUpRight, ArrowDownRight, Trash2
} from 'lucide-react'

interface Expense {
    id: string
    category: string
    description: string
    amount: number
    date: string
    created_at: string
}

const EXPENSE_CATEGORIES = [
    { value: 'bahan_baku', label: 'Bahan Baku', emoji: '🥛' },
    { value: 'operasional', label: 'Operasional', emoji: '⚡' },
    { value: 'gaji', label: 'Gaji', emoji: '👤' },
    { value: 'lainnya', label: 'Lainnya', emoji: '📦' },
]

export default function Finance() {
    const { orders } = useOrderStore()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddExpense, setShowAddExpense] = useState(false)
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')

    // Expense form
    const [form, setForm] = useState({ category: 'bahan_baku', description: '', amount: 0, date: new Date().toISOString().slice(0, 10) })

    const fetchExpenses = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false })
            if (error) throw error
            setExpenses(data || [])
        } catch {
            // Table might not exist yet — just show empty
            setExpenses([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchExpenses() }, [])

    // Date filter
    const getDateRange = () => {
        const now = new Date()
        const start = new Date()
        if (dateRange === 'today') {
            start.setHours(0, 0, 0, 0)
        } else if (dateRange === 'week') {
            start.setDate(now.getDate() - 7)
        } else {
            start.setMonth(now.getMonth() - 1)
        }
        return start
    }

    // Revenue from orders
    const filteredOrders = useMemo(() => {
        const start = getDateRange()
        return orders.filter(o => o.status === 'completed' && new Date(o.createdAt) >= start)
    }, [orders, dateRange])

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0)

    // Expenses filtered
    const filteredExpenses = useMemo(() => {
        const start = getDateRange()
        return expenses.filter(e => new Date(e.date) >= start)
    }, [expenses, dateRange])

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

    // Expense by category
    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
        ...cat,
        total: filteredExpenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0)
    }))

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('expenses')
                .insert([form])
            if (error) throw error
            toast.success('Pengeluaran berhasil ditambahkan')
            setShowAddExpense(false)
            setForm({ category: 'bahan_baku', description: '', amount: 0, date: new Date().toISOString().slice(0, 10) })
            fetchExpenses()
        } catch (err) {
            console.error(err)
            toast.error('Gagal menambahkan pengeluaran. Pastikan tabel "expenses" sudah dibuat di Supabase.')
        }
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Hapus pengeluaran ini?')) return
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error
            toast.success('Pengeluaran dihapus')
            setExpenses(prev => prev.filter(e => e.id !== id))
        } catch {
            toast.error('Gagal menghapus')
        }
    }

    const handleExportCSV = () => {
        const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah']
        const rows = filteredExpenses.map(e => [e.date, e.category, `"${e.description}"`, e.amount])
        const csv = [
            `NataFood Finance Report (${dateRange})`,
            `Total Revenue: ${totalRevenue}`,
            `Total Expenses: ${totalExpenses}`,
            `Net Profit: ${netProfit}`,
            '',
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `natafood-finance-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Laporan keuangan berhasil diunduh!')
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col overflow-hidden bg-[#f8f7f5] dark:bg-[#23170f]">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-[#2d2018] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">Laporan Keuangan</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">NataFood • Finance</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {(['today', 'week', 'month'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                                    dateRange === r
                                        ? "bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {r === 'today' ? 'Hari Ini' : r === 'week' ? '7 Hari' : '30 Hari'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => setShowAddExpense(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Catat Pengeluaran</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Revenue */}
                    <div className="bg-white dark:bg-[#2d2018] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pendapatan</span>
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-green-600">{formatRupiah(totalRevenue)}</p>
                        <p className="text-xs text-gray-400 mt-1">{filteredOrders.length} pesanan selesai</p>
                    </div>

                    {/* Expenses */}
                    <div className="bg-white dark:bg-[#2d2018] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pengeluaran</span>
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <ArrowDownRight className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-red-500">{formatRupiah(totalExpenses)}</p>
                        <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} transaksi</p>
                    </div>

                    {/* Net Profit */}
                    <div className={cn(
                        "rounded-xl p-6 shadow-sm border",
                        netProfit >= 0
                            ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border-emerald-200 dark:border-emerald-800"
                            : "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/10 border-red-200 dark:border-red-800"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Laba Bersih</span>
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", netProfit >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                                {netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                        </div>
                        <p className={cn("text-3xl font-extrabold", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {formatRupiah(netProfit)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Margin: {profitMargin}%</p>
                    </div>
                </div>

                {/* Expense Breakdown + Recent Expenses */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Breakdown */}
                    <div className="bg-white dark:bg-[#2d2018] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Breakdown Pengeluaran</h3>
                        <div className="space-y-4">
                            {expenseByCategory.map(cat => (
                                <div key={cat.value}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {cat.emoji} {cat.label}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatRupiah(cat.total)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: totalExpenses > 0 ? `${(cat.total / totalExpenses) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Expenses Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#2d2018] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Pengeluaran</h3>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center py-12 text-gray-400">Memuat...</div>
                        ) : filteredExpenses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Banknote className="w-10 h-10 mb-2 opacity-40" />
                                <p className="font-medium">Belum ada pengeluaran</p>
                                <p className="text-sm">Klik "Catat Pengeluaran" untuk memulai.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                            <th className="pb-3">Tanggal</th>
                                            <th className="pb-3">Kategori</th>
                                            <th className="pb-3">Deskripsi</th>
                                            <th className="pb-3 text-right">Jumlah</th>
                                            <th className="pb-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.slice(0, 10).map(expense => {
                                            const cat = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
                                            return (
                                                <tr key={expense.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                                    <td className="py-3 text-gray-600 dark:text-gray-300">{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                                                            {cat?.emoji} {cat?.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-gray-700 dark:text-gray-200">{expense.description || '-'}</td>
                                                    <td className="py-3 text-right font-bold text-red-500">{formatRupiah(expense.amount)}</td>
                                                    <td className="py-3">
                                                        <button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Expense Modal */}
            {showAddExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowAddExpense(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Catat Pengeluaran</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Kategori</label>
                                <select
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    {EXPENSE_CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Deskripsi</label>
                                <input
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="e.g. Beli susu 10 liter"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Jumlah (Rp)</label>
                                    <input
                                        type="number" required min={1}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.amount || ''}
                                        onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Tanggal</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                        value={form.date}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-orange-600 shadow-lg shadow-primary/20">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
