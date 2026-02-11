import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/format'
import { toast } from '@/store/toastStore'
import {
    Calculator, TrendingUp, TrendingDown, AlertTriangle,
    Package, DollarSign, BarChart3, RefreshCw, Search
} from 'lucide-react'

interface ProductHPP {
    product_id: string
    product_name: string
    selling_price: number
    hpp: number
    margin_percent: number
    ingredient_count: number
}

interface DailyProfit {
    profit_date: string
    total_orders: number
    total_revenue: number
    total_hpp: number
    total_gross_profit: number
    avg_margin_percent: number
}

export default function HPPDashboard() {
    const [products, setProducts] = useState<ProductHPP[]>([])
    const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [hppRes, profitRes] = await Promise.all([
                supabase.from('product_hpp').select('*').order('product_name'),
                supabase.from('daily_profit').select('*').limit(7)
            ])

            if (hppRes.error) throw hppRes.error
            if (profitRes.error) throw profitRes.error

            setProducts((hppRes.data || []).map((p: any) => ({
                product_id: p.product_id,
                product_name: p.product_name,
                selling_price: Number(p.selling_price),
                hpp: Number(p.hpp),
                margin_percent: Number(p.margin_percent),
                ingredient_count: Number(p.ingredient_count)
            })))

            setDailyProfits((profitRes.data || []).map((d: any) => ({
                profit_date: d.profit_date,
                total_orders: Number(d.total_orders),
                total_revenue: Number(d.total_revenue),
                total_hpp: Number(d.total_hpp),
                total_gross_profit: Number(d.total_gross_profit),
                avg_margin_percent: Number(d.avg_margin_percent)
            })))
        } catch (err) {
            console.error('Error fetching HPP data:', err)
            toast.error('Gagal memuat data HPP. Pastikan schema V7 sudah dijalankan.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Summary calculations
    const productsWithRecipe = products.filter(p => p.ingredient_count > 0)
    const productsWithoutRecipe = products.filter(p => p.ingredient_count === 0)
    const avgMargin = productsWithRecipe.length > 0
        ? productsWithRecipe.reduce((sum, p) => sum + p.margin_percent, 0) / productsWithRecipe.length
        : 0
    const lowMarginProducts = productsWithRecipe.filter(p => p.margin_percent < 30)

    const filteredProducts = products.filter(p =>
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getMarginColor = (margin: number) => {
        if (margin >= 50) return 'text-emerald-600 dark:text-emerald-400'
        if (margin >= 30) return 'text-blue-600 dark:text-blue-400'
        if (margin >= 15) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const getMarginBg = (margin: number) => {
        if (margin >= 50) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        if (margin >= 30) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        if (margin >= 15) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <span className="ml-2 text-gray-500">Memuat data HPP...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />
                        HPP Calculator & Profit Analysis
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Analisis Harga Pokok Penjualan berdasarkan BOM/Resep
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Produk"
                    value={`${products.length}`}
                    subtitle={`${productsWithRecipe.length} punya resep`}
                    icon={<Package className="w-5 h-5" />}
                    color="blue"
                />
                <SummaryCard
                    title="Rata-rata Margin"
                    value={`${avgMargin.toFixed(1)}%`}
                    subtitle={avgMargin >= 30 ? 'Margin sehat' : 'Perlu perhatian'}
                    icon={<BarChart3 className="w-5 h-5" />}
                    color={avgMargin >= 30 ? 'green' : 'yellow'}
                />
                <SummaryCard
                    title="Margin Rendah"
                    value={`${lowMarginProducts.length}`}
                    subtitle="Produk < 30% margin"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    color={lowMarginProducts.length > 0 ? 'red' : 'green'}
                />
                <SummaryCard
                    title="Tanpa Resep"
                    value={`${productsWithoutRecipe.length}`}
                    subtitle="HPP belum bisa dihitung"
                    icon={<DollarSign className="w-5 h-5" />}
                    color={productsWithoutRecipe.length > 0 ? 'yellow' : 'green'}
                />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Product HPP Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Harga Jual</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">HPP</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Profit / Porsi</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Margin</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Bahan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredProducts.map(product => {
                                const profit = product.selling_price - product.hpp
                                const hasRecipe = product.ingredient_count > 0
                                return (
                                    <tr
                                        key={product.product_id}
                                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {product.product_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                            {formatRupiah(product.selling_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {hasRecipe ? (
                                                <span className="text-red-600 dark:text-red-400">{formatRupiah(product.hpp)}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {hasRecipe ? (
                                                <span className={cn("font-semibold", profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600')}>
                                                    {formatRupiah(profit)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {hasRecipe ? (
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                                                    getMarginBg(product.margin_percent),
                                                    getMarginColor(product.margin_percent)
                                                )}>
                                                    {product.margin_percent >= 30 ? (
                                                        <TrendingUp className="w-3 h-3" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3" />
                                                    )}
                                                    {product.margin_percent.toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">No recipe</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn(
                                                "inline-block min-w-[24px] text-center text-xs font-bold rounded-full px-2 py-0.5",
                                                hasRecipe
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                            )}>
                                                {product.ingredient_count}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Profit Trend */}
            {dailyProfits.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Profit Harian (7 Hari Terakhir)
                    </h3>
                    <div className="space-y-3">
                        {dailyProfits.map(day => (
                            <div key={day.profit_date} className="flex items-center gap-4">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-24 shrink-0">
                                    {new Date(day.profit_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                                    {/* HPP bar (red) */}
                                    <div
                                        className="absolute left-0 top-0 h-full bg-red-400/60 rounded-full"
                                        style={{ width: day.total_revenue > 0 ? `${(day.total_hpp / day.total_revenue) * 100}%` : '0%' }}
                                    />
                                    {/* Profit bar (green) overlay */}
                                    <div
                                        className="absolute right-0 top-0 h-full bg-emerald-500/60 rounded-full"
                                        style={{ width: day.total_revenue > 0 ? `${(day.total_gross_profit / day.total_revenue) * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="text-right shrink-0 w-32">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(day.total_gross_profit)}
                                    </span>
                                    <span className={cn(
                                        "ml-2 text-[10px] font-bold",
                                        day.avg_margin_percent >= 30 ? 'text-emerald-500' : 'text-yellow-500'
                                    )}>
                                        ({day.avg_margin_percent}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400/60" /> HPP</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/60" /> Gross Profit</span>
                    </div>
                </div>
            )}

            {/* Margin Legend */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Panduan Margin</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Excellent', min: '≥ 50%', color: 'emerald' },
                        { label: 'Good', min: '30-49%', color: 'blue' },
                        { label: 'Low', min: '15-29%', color: 'yellow' },
                        { label: 'Critical', min: '< 15%', color: 'red' },
                    ].map(tier => (
                        <div key={tier.label} className={cn(
                            "rounded-lg p-3 border text-center",
                            `bg-${tier.color}-50 dark:bg-${tier.color}-900/20 border-${tier.color}-200 dark:border-${tier.color}-800`
                        )}>
                            <p className={`text-sm font-bold text-${tier.color}-600 dark:text-${tier.color}-400`}>{tier.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tier.min}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Summary Card ───────────────────────────────────────────────────────────
function SummaryCard({ title, value, subtitle, icon, color }: {
    title: string; value: string; subtitle: string; icon: React.ReactNode
    color: 'blue' | 'green' | 'yellow' | 'red'
}) {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors[color])}>
                    {icon}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
    )
}
