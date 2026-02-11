import { useState } from 'react'
import { useShiftStore } from '@/store/shiftStore'
import { formatRupiah } from '@/lib/format'
import { X, DollarSign, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Open Shift Dialog ─────────────────────────────────────────────
export function OpenShiftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { openShift } = useShiftStore()
    const [amount, setAmount] = useState('')
    const [saving, setSaving] = useState(false)

    if (!open) return null

    const quickAmounts = [100000, 200000, 300000, 500000]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const val = Number(amount)
        if (val <= 0) return
        setSaving(true)
        const success = await openShift(val)
        setSaving(false)
        if (success) onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Buka Shift Kasir</h2>
                    <p className="text-sm text-gray-500 mt-1">Masukkan modal awal untuk memulai shift.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modal Awal (Rp)</label>
                        <input
                            type="number" required min={0}
                            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-4 py-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary/50 outline-none"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2">
                        {quickAmounts.map(q => (
                            <button
                                key={q} type="button"
                                onClick={() => setAmount(String(q))}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                                    Number(amount) === q
                                        ? "bg-primary text-white border-primary"
                                        : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary"
                                )}
                            >
                                {(q / 1000).toFixed(0)}K
                            </button>
                        ))}
                    </div>
                    <button
                        type="submit"
                        disabled={saving || !amount || Number(amount) <= 0}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? 'Memproses...' : <>Mulai Shift <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Close Shift Dialog ────────────────────────────────────────────
interface CloseResult { expected: number; actual: number; difference: number }

export function CloseShiftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { closeShift, activeShift } = useShiftStore()
    const [amount, setAmount] = useState('')
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState<CloseResult | null>(null)

    if (!open || !activeShift) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const val = Number(amount)
        if (val < 0) return
        setSaving(true)
        const res = await closeShift(val)
        setSaving(false)
        if (res) setResult(res)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative animate-in zoom-in-95 duration-200">
                <button onClick={() => { setResult(null); onClose() }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>

                {result ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold">Shift Ditutup</h2>
                        <div className="space-y-2 text-sm bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                            <div className="flex justify-between"><span className="text-gray-500">Kas Diharapkan</span><span className="font-bold">{formatRupiah(result.expected)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Kas Aktual</span><span className="font-bold">{formatRupiah(result.actual)}</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="text-gray-500">Selisih</span>
                                <span className={cn("font-bold", result.difference >= 0 ? "text-green-600" : "text-red-600")}>
                                    {result.difference >= 0 ? '+' : ''}{formatRupiah(result.difference)}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => { setResult(null); onClose() }} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600">
                            Selesai
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tutup Shift Kasir</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Shift dibuka: {new Date(activeShift.opened_at).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kas Akhir (Rp)</label>
                                <input
                                    type="number" required min={0}
                                    className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-4 py-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                Modal awal: {formatRupiah(activeShift.start_cash)}
                            </div>
                            <button
                                type="submit"
                                disabled={saving || !amount}
                                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Memproses...' : 'Tutup Shift'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
