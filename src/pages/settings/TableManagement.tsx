import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from '@/store/toastStore'
import { Modal } from '@/components/ui/modal' // Changed from Dialog

interface Table {
    id: string
    number: string
    capacity: number
    status: 'available' | 'occupied' | 'reserved'
    location: string
}

export default function TableManagement() {
    const [tables, setTables] = useState<Table[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTable, setEditingTable] = useState<Table | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Table>>({
        number: '',
        capacity: 4,
        status: 'available',
        location: 'Main Hall'
    })

    useEffect(() => {
        fetchTables()
    }, [])

    const fetchTables = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('number', { ascending: true })

        if (error) {
            console.error('Error fetching tables:', error)
            toast.error('Gagal memuat data meja.')
        } else {
            setTables(data || [])
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        if (!formData.number) return toast.error('Nomor meja wajib diisi')

        try {
            if (editingTable) {
                // Update
                const { error } = await supabase
                    .from('tables')
                    .update(formData)
                    .eq('id', editingTable.id)
                if (error) throw error
                toast.success('Meja berhasil diperbarui')
            } else {
                // Insert
                const { error } = await supabase
                    .from('tables')
                    .insert([formData])
                if (error) throw error
                toast.success('Meja berhasil ditambahkan')
            }
            fetchTables()
            setIsDialogOpen(false)
            setEditingTable(null)
            setFormData({ number: '', capacity: 4, status: 'available', location: 'Main Hall' })
        } catch (error) {
            console.error('Error saving table:', error)
            toast.error('Gagal menyimpan meja')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus meja ini?')) return

        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Gagal menghapus meja')
        } else {
            toast.success('Meja dihapus')
            fetchTables()
        }
    }

    const openEdit = (table: Table) => {
        setEditingTable(table)
        setFormData(table)
        setIsDialogOpen(true)
    }

    const openAdd = () => {
        setEditingTable(null)
        setFormData({ number: '', capacity: 4, status: 'available', location: 'Main Hall' })
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold">Manajemen Meja</h2>
                    <p className="text-sm text-muted-foreground">Atur daftar meja, kapasitas, dan lokasi.</p>
                </div>
                <Button onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Meja
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : tables.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Belum ada data meja.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border shadow-sm relative group hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg">{table.number}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${table.status === 'available' ? 'bg-green-100 text-green-700' :
                                        table.status === 'occupied' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {table.status}
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                                <p>Kapasitas: {table.capacity} org</p>
                                <p>Lokasi: {table.location}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => openEdit(table)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(table.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Replaced Dialog with Modal */}
            <Modal
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nomor / Nama Meja</label>
                        <Input
                            value={formData.number}
                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                            placeholder="e.g. T1, VIP 1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kapasitas</label>
                            <Input
                                type="number"
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lokasi</label>
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status Awal</label>
                        <div className="flex gap-2">
                            {['available', 'occupied', 'reserved'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFormData({ ...formData, status: s as any })}
                                    className={`px-3 py-1.5 text-xs font-bold rounded capitalize border ${formData.status === s
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSave}>{editingTable ? 'Simpan Perubahan' : 'Tambah'}</Button>
                </div>
            </Modal>
        </div>
    )
}
