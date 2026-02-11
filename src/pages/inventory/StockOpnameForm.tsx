import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useInventoryStore, type StockItem } from '@/store/inventoryStore'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { toast } from '@/store/toastStore'

interface OpnameItem extends StockItem {
    physical_qty: number | ''
    diff: number
    reason: string
}

export default function StockOpnameForm() {
    const navigate = useNavigate()
    const { stock, fetchStock, updateStock } = useInventoryStore()
    const [items, setItems] = useState<OpnameItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        fetchStock()
    }, [])

    useEffect(() => {
        // Initialize form items from stock
        // We only show trackable items (ingredients/etc), maybe filter logic later
        setItems(stock.map(s => ({
            ...s,
            physical_qty: s.currentStock, // Default to current system stock for easier entry
            diff: 0,
            reason: ''
        })))
    }, [stock])

    const handleQtyChange = (id: string, qty: number | '') => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item
            const physical = qty === '' ? 0 : qty
            return {
                ...item,
                physical_qty: qty,
                diff: physical - item.currentStock
            }
        }))
    }

    const handleReasonChange = (id: string, reason: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, reason } : item))
    }

    const handleSubmit = async () => {
        const changedItems = items.filter(i => i.diff !== 0)

        if (changedItems.length === 0) {
            if (!confirm('No discrepancies found (Physics = System). Save anyway?')) return
        }

        setSaving(true)
        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // 2. Insert Header
            const { data: adj, error: adjError } = await supabase
                .from('inventory_adjustments')
                .insert({
                    staff_id: user.id, // In real app, might be profile id. We assume auth.uid triggers relation or we fetch profile first.
                    // Actually supabase auth.uid() is distinct from profiles.id usually.
                    // We need profile id.
                    // Let's check session logic. Usually we store profile.
                    // For now, let's try inserting user.id. If profile table has user.id as PK, it works.
                    // Schema V1: profiles.id references auth.users.id. So yes.
                    notes: notes || 'Routine Check',
                    status: 'completed'
                })
                .select()
                .single()

            if (adjError) throw adjError

            // 3. Insert Items
            const itemsToInsert = items.map(i => ({
                adjustment_id: adj.id,
                inventory_id: i.id,
                system_qty: i.currentStock,
                physical_qty: i.physical_qty === '' ? 0 : i.physical_qty,
                reason: i.reason
            }))

            const { error: itemsError } = await supabase
                .from('inventory_adjustment_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            // 4. Update Inventory Stock
            // We do this in parallel for speed
            await Promise.all(items.map(i => {
                if (i.diff !== 0) {
                    return updateStock(i.id, Number(i.physical_qty))
                }
                return Promise.resolve()
            }))

            toast.success('Stock Opname saved successfully')
            navigate('/inventory/opname')

        } catch (err: any) {
            console.error(err)
            toast.error('Failed to save: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const itemsWithDiff = items.filter(i => i.diff !== 0).length

    return (
        <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#23170f] pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-[#2d2018] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inventory/opname')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">New Stock Opname</h1>
                        <p className="text-xs text-gray-500">Adjustment Entry</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right text-sm">
                        <p className="text-gray-500">Discrepancies</p>
                        <p className={`font-bold ${itemsWithDiff > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {itemsWithDiff} Items
                        </p>
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Controls */}
                <div className="bg-white dark:bg-[#2d2018] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <input
                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Optional Notes / Reference..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#2d2018] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-3">Item Name</th>
                                    <th className="px-6 py-3 w-32 text-center">System Qty</th>
                                    <th className="px-6 py-3 w-32 text-center">Physical Qty</th>
                                    <th className="px-6 py-3 w-24 text-center">Diff</th>
                                    <th className="px-6 py-3">Reason / Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredItems.map(item => {
                                    const isDiff = item.diff !== 0
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.sku} • {item.unit}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center font-mono">
                                                {item.currentStock}
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    className={`w-24 text-center py-1.5 rounded-lg border outline-none font-bold ${isDiff
                                                        ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800'
                                                        : 'border-gray-200 bg-white dark:bg-zinc-800 dark:border-gray-700'
                                                        }`}
                                                    value={item.physical_qty}
                                                    onChange={e => handleQtyChange(item.id, e.target.value === '' ? '' : Number(e.target.value))}
                                                    onFocus={e => e.target.select()}
                                                />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {isDiff && (
                                                    <span className={`font-bold px-2 py-1 rounded text-xs ${item.diff > 0
                                                        ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                                                        : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                                                        }`}>
                                                        {item.diff > 0 ? '+' : ''}{item.diff}
                                                    </span>
                                                )}
                                                {!isDiff && <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="px-6 py-3">
                                                {isDiff && (
                                                    <input
                                                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-primary outline-none py-1 text-xs"
                                                        placeholder="Reason? (e.g. Spoilage)"
                                                        value={item.reason}
                                                        onChange={e => handleReasonChange(item.id, e.target.value)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#2d2018] border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 z-30">
                <button
                    onClick={() => navigate('/inventory/opname')}
                    className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-8 py-2 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? 'Saving...' : (
                        <>
                            <Save className="w-4 h-4" />
                            Confirm & Update Stock
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
