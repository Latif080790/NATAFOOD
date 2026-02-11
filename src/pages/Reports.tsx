import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Reports() {
    const [dateRange, setDateRange] = useState('30') // '7', '30', '90'
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0, avgOrderValue: 0 })
    const [salesData, setSalesData] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [categoryData, setCategoryData] = useState<any[]>([])

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

    useEffect(() => {
        fetchReportData()
    }, [dateRange])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(endDate.getDate() - parseInt(dateRange))

            // 1. Fetch Sales Trends
            const { data: sales, error: salesError } = await supabase
                .rpc('get_sales_analytics', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                })

            if (salesError) throw salesError

            // Calculate Summary
            const totalSales = sales?.reduce((acc: number, curr: any) => acc + curr.total_sales, 0) || 0
            const totalOrders = sales?.reduce((acc: number, curr: any) => acc + (curr.total_orders || 0), 0) || 0 // Corrected type
            const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

            setSummary({ totalSales, totalOrders, avgOrderValue })
            setSalesData(sales?.map((d: any) => ({
                ...d,
                date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            })) || [])

            // 2. Fetch Top Products
            const { data: products, error: prodError } = await supabase
                .rpc('get_top_products', {
                    limit_count: 5,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                })

            if (prodError) throw prodError
            setTopProducts(products || [])

            // 3. Fetch Category Distribution
            const { data: categories, error: catError } = await supabase
                .rpc('get_sales_by_category', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                })

            if (catError) throw catError
            setCategoryData(categories || [])

        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan Penjualan</h1>
                    <p className="text-gray-500">Analisis performa bisnis Anda</p>
                </div>
                <div className="flex bg-white dark:bg-zinc-800 rounded-lg p-1 border shadow-sm">
                    {['7', '30', '90'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                dateRange === range
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                            )}
                        >
                            {range} Hari Terakhir
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary.totalSales)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            +20.1% dari periode lalu
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            +12.5% dari periode lalu
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Order</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary.avgOrderValue)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                            -2.3% dari periode lalu
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Trend Line Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Tren Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatRupiah(Number(value) || 0), "Total Sales"]}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total_sales"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Products Bar Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Produk Terlaris (Revenue)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="product_name"
                                    type="category"
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatRupiah(Number(value) || 0), "Revenue"]}
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total_revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Pie Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Kategori Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total_sales"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [formatRupiah(Number(value) || 0), "Sales"]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {categoryData.map((entry, index) => (
                                <div key={index} className="flex items-center text-xs text-gray-500">
                                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    {entry.category_name} ({Math.round(entry.percentage)}%)
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
