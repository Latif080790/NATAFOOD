import { useEffect, useState } from 'react'
import { useShiftStore } from '@/store/shiftStore'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import { toast } from '@/store/toastStore'
import { Clock, DollarSign, Plus, Minus, History } from 'lucide-react'

export default function Shift() {
    const { activeShift, checkActiveShift, openShift, closeShift, loading } = useShiftStore()
    const [startCash, setStartCash] = useState(200000) // Default modal awal
    const [actualCash, setActualCash] = useState(0)
    const [notes, setNotes] = useState('')
    const [salesSummary, setSalesSummary] = useState({ totalSales: 0, cashSales: 0, orderCount: 0, cashIn: 0, cashOut: 0 })
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [dialogOpen, setDialogOpen] = useState<'open' | 'close' | 'log' | null>(null)
    const [logForm, setLogForm] = useState({ type: 'in', amount: 0, description: '' })

    // Check shift on mount
    useEffect(() => {
        checkActiveShift()
    }, [])

    // Fetch summary when active shift changes
    useEffect(() => {
        if (activeShift) {
            fetchSummary()
            const interval = setInterval(fetchSummary, 60000) // Refresh every minute
            return () => clearInterval(interval)
        }
    }, [activeShift])

    const fetchSummary = async () => {
        if (!activeShift) return
        setLoadingSummary(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Orders
            const { data: orders, error: orderError } = await supabase
                .from('orders')
                .select('total_amount, payment_method')
                .eq('staff_id', user.id) // Only this staff's orders? Or all orders? Usually Shift is per Staff.
                .gte('created_at', activeShift.start_time)

            if (orderError) throw orderError

            // 2. Fetch Cash Logs
            const { data: logs, error: logError } = await supabase
                .from('cash_logs')
                .select('type, amount')
                .eq('shift_id', activeShift.id)

            if (logError) throw logError

            const totalSales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
            const cashSales = orders?.filter((o: any) => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0) || 0

            const cashIn = logs?.filter((l: any) => l.type === 'in').reduce((sum, l) => sum + l.amount, 0) || 0
            const cashOut = logs?.filter((l: any) => l.type === 'out').reduce((sum, l) => sum + l.amount, 0) || 0

            setSalesSummary({ totalSales, cashSales, orderCount: orders?.length || 0, cashIn, cashOut })

        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSummary(false)
        }
    }

    const handleOpenShift = async () => {
        try {
            await openShift(startCash)
            toast.success('Shift started')
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleCloseShift = async () => {
        try {
            await closeShift(actualCash, notes)
            toast.success('Shift closed')
            setDialogOpen(null)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleAddLog = async () => {
        if (!activeShift) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase.from('cash_logs').insert({
                shift_id: activeShift.id,
                type: logForm.type,
                amount: logForm.amount,
                description: logForm.description,
                created_by: user?.id
            })
            if (error) throw error
            toast.success('Cash log added')
            setDialogOpen(null)
            fetchSummary()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading) return <div className="p-8 text-center">Checking shift status...</div>

    // ─── NO ACTIVE SHIFT: SHOW OPEN FORM ─────────────────────────────
    if (!activeShift) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#23170f] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#2d2018] max-w-md w-full rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                        <Clock className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Start Shift</h1>
                        <p className="text-gray-500 dark:text-gray-400">Enter beginning cash amount in drawer</p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-left">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modal Awal (Start Cash)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/50"
                                    value={startCash}
                                    onChange={e => setStartCash(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleOpenShift}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            Open Register
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── ACTIVE SHIFT DASHBOARD ──────────────────────────────────────
    const expectedCash = activeShift.start_cash + salesSummary.cashSales + salesSummary.cashIn - salesSummary.cashOut

    return (
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#23170f] pb-24">
            <header className="bg-white dark:bg-[#2d2018] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        Active Shift
                        {loadingSummary && <span className="text-xs font-normal text-gray-400 animate-pulse">(Updating...)</span>}
                    </h1>
                    <p className="text-xs text-gray-500">Started: {new Date(activeShift.start_time).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setDialogOpen('log')} className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Cash In/Out
                    </button>
                    <button onClick={() => setDialogOpen('close')} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 transition-colors">
                        Close Shift
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoCard label="Start Cash" value={activeShift.start_cash} icon={History} />
                    <InfoCard label="Total Sales" value={salesSummary.totalSales} icon={DollarSign} highlight />
                    <InfoCard label="Cash In" value={salesSummary.cashIn} icon={Plus} color="text-green-600" />
                    <InfoCard label="Cash Out" value={salesSummary.cashOut} icon={Minus} color="text-red-600" />
                </div>

                {/* Cash Drawer Calculation */}
                <div className="bg-white dark:bg-[#2d2018] p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Cash Drawer Estimate</h3>
                    <div className="space-y-2 text-sm">
                        <Row label="Modal Awal" value={activeShift.start_cash} />
                        <Row label="Penjualan Tunai" value={salesSummary.cashSales} />
                        <Row label="Penjualan Non-Tunai" value={salesSummary.totalSales - salesSummary.cashSales} />
                        <Row label="Pemasukan Lain" value={salesSummary.cashIn} />
                        <Row label="Pengeluaran" value={-salesSummary.cashOut} />
                        <div className="border-t pt-2 mt-2 font-bold flex justify-between text-lg">
                            <span>Expected Cash in Drawer</span>
                            <span className="text-primary">{formatRupiah(expectedCash)}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Close Dialog */}
            {dialogOpen === 'close' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#2d2018] w-full max-w-md rounded-2xl p-6 space-y-4">
                        <h2 className="text-xl font-bold">Close Shift</h2>
                        <div>
                            <label className="text-sm font-medium">Uang Fisik di Laci (Actual Cash)</label>
                            <input
                                type="number"
                                className="w-full mt-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary font-bold text-xl"
                                value={actualCash}
                                onChange={e => setActualCash(Number(e.target.value))}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Catatan (Optional)</label>
                            <textarea
                                className="w-full mt-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary h-20"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setDialogOpen(null)} className="flex-1 py-3 rounded-xl border font-medium">Cancel</button>
                            <button onClick={handleCloseShift} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Confirm Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Dialog */}
            {dialogOpen === 'log' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#2d2018] w-full max-w-md rounded-2xl p-6 space-y-4">
                        <h2 className="text-xl font-bold">Cash Log</h2>
                        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                onClick={() => setLogForm({ ...logForm, type: 'in' })}
                                className={`flex-1 py-2 rounded-md font-medium text-sm ${logForm.type === 'in' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                            >
                                Cash In (+)
                            </button>
                            <button
                                onClick={() => setLogForm({ ...logForm, type: 'out' })}
                                className={`flex-1 py-2 rounded-md font-medium text-sm ${logForm.type === 'out' ? 'bg-white shadow text-red-700' : 'text-gray-500'}`}
                            >
                                Cash Out (-)
                            </button>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Amount</label>
                            <input
                                type="number"
                                className="w-full mt-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-primary font-bold"
                                value={logForm.amount}
                                onChange={e => setLogForm({ ...logForm, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <input
                                className="w-full mt-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g. Beli Es Batu"
                                value={logForm.description}
                                onChange={e => setLogForm({ ...logForm, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setDialogOpen(null)} className="flex-1 py-3 rounded-xl border font-medium">Cancel</button>
                            <button onClick={handleAddLog} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function InfoCard({ label, value, icon: Icon, highlight, color }: any) {
    return (
        <div className={`bg-white dark:bg-[#2d2018] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm ${highlight ? 'ring-1 ring-primary/20' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-gray-500">{label}</p>
                <Icon className={`w-4 h-4 ${color || 'text-gray-400'}`} />
            </div>
            <p className={`text-lg font-bold ${color || 'text-gray-900 dark:text-white'}`}>{formatRupiah(value)}</p>
        </div>
    )
}

function Row({ label, value }: any) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatRupiah(value)}</span>
        </div>
    )
}
