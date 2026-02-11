import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Search, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/store/toastStore'

interface Product {
    id: string
    name: string
    price: number
    category: string
    image?: string
    description?: string
}

export default function MenuManagement() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<string[]>(['Food', 'Drink', 'Snack', 'Dessert'])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        category: 'Food',
        image: '',
        description: ''
    })

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const { data } = await supabase
                .from('categories')
                .select('name')
                .order('name')
            if (data && data.length > 0) {
                setCategories(data.map((c: any) => c.name))
            }
        } catch {
            // Keep defaults if table doesn't exist
        }
    }

    const fetchProducts = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name')

        if (data) setProducts(data)
        if (error) toast.error('Gagal mengambil data menu')
        setIsLoading(false)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingProduct) {
                // Update
                const { error } = await supabase
                    .from('products')
                    .update(formData)
                    .eq('id', editingProduct.id)
                if (error) throw error
                toast.success('Produk berhasil diperbarui')
            } else {
                // Create
                const { error } = await supabase
                    .from('products')
                    .insert([formData])
                if (error) throw error
                toast.success('Produk berhasil ditambahkan')
            }
            fetchProducts()
            setIsModalOpen(false)
            setEditingProduct(null)
            setFormData({ name: '', price: 0, category: 'Food', image: '', description: '' })
        } catch (error) {
            console.error(error)
            toast.error('Gagal menyimpan produk')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Gagal menghapus produk')
        } else {
            toast.success('Produk dihapus')
            fetchProducts()
        }
    }

    const openEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData(product)
        setIsModalOpen(true)
    }

    const openAdd = () => {
        setEditingProduct(null)
        setFormData({ name: '', price: 0, category: 'Food', image: '', description: '' })
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari produk..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={openAdd} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm overflow-hidden flex flex-col group">
                            <div className="aspect-video bg-gray-100 dark:bg-zinc-900 relative overflow-hidden">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                    {product.category}
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                                <p className="text-primary font-bold">Rp {product.price.toLocaleString()}</p>
                                <div className="mt-auto pt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                                        <Pencil className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal (Simple Inline for now) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nama Produk</label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Harga</label>
                                    <Input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Kategori</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">URL Gambar</label>
                                <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit">{editingProduct ? 'Simpan Perubahan' : 'Buat Produk'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
