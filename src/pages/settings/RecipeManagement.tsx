import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { toast } from '@/store/toastStore'

interface Product {
    id: string
    name: string
}

interface InventoryItem {
    id: string
    name: string
    unit: string
}

interface Ingredient {
    id: string // primary key of relationship row
    inventory_id: string
    quantity_required: number
    unit: string
    inventory_name?: string
}

export default function RecipeManagement() {
    const [products, setProducts] = useState<Product[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // New Ingredient Form
    const [newIngId, setNewIngId] = useState('')
    const [newIngQty, setNewIngQty] = useState('')

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedProductId) {
            fetchRecipe(selectedProductId)
        } else {
            setIngredients([])
        }
    }, [selectedProductId])

    const fetchInitialData = async () => {
        const { data: pData } = await supabase.from('products').select('id, name').order('name')
        const { data: iData } = await supabase.from('inventory').select('id, name, unit').order('name')
        if (pData) setProducts(pData)
        if (iData) setInventory(iData)
    }

    const fetchRecipe = async (productId: string) => {
        setIsLoading(true)
        const { data } = await supabase
            .from('product_ingredients')
            .select(`
                id,
                inventory_id,
                quantity_required,
                unit,
                inventory:inventory_id (name, unit)
            `)
            .eq('product_id', productId)

        if (data) {
            // Flatten the structure slightly for easier display
            const mapped = data.map((item: any) => ({
                id: item.id,
                inventory_id: item.inventory_id,
                quantity_required: item.quantity_required,
                unit: item.unit || item.inventory.unit,
                inventory_name: item.inventory.name
            }))
            setIngredients(mapped)
        }
        setIsLoading(false)
    }

    const handleAddIngredient = async () => {
        if (!selectedProductId || !newIngId || !newIngQty) return

        const invItem = inventory.find(i => i.id === newIngId)
        if (!invItem) return

        const { error } = await supabase
            .from('product_ingredients')
            .insert({
                product_id: selectedProductId,
                inventory_id: newIngId,
                quantity_required: parseFloat(newIngQty),
                unit: invItem.unit
            })

        if (error) {
            toast.error('Gagal menambahkan bahan')
            console.error(error)
        } else {
            toast.success('Bahan ditambahkan')
            fetchRecipe(selectedProductId)
            setNewIngId('')
            setNewIngQty('')
        }
    }

    const handleRemoveIngredient = async (id: string) => {
        const { error } = await supabase
            .from('product_ingredients')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Gagal menghapus bahan')
        } else {
            toast.success('Bahan dihapus')
            fetchRecipe(selectedProductId!) // Safe bang because we can't remove without selecting
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Left Col: Product List */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm p-4 flex flex-col">
                <h3 className="font-bold mb-4">1. Pilih Produk</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {products.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProductId(p.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedProductId === p.id
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-zinc-700'
                                }`}
                        >
                            <span className="truncate">{p.name}</span>
                            {selectedProductId === p.id && <ArrowRight className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Col: Recipe Editor */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-800 rounded-xl border shadow-sm p-6 flex flex-col">
                <h3 className="font-bold mb-4">2. Atur Resep (Bahan Baku)</h3>

                {!selectedProductId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
                        Pilih produk di sebelah kiri untuk mengatur resep
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* List Existing Ingredients */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-500">Bahan yang digunakan:</h4>
                            {isLoading ? (
                                <div className="py-8 flex justify-center text-sm text-muted-foreground">Loading...</div>
                            ) : ingredients.length === 0 ? (
                                <p className="text-sm italic text-gray-400">Belum ada resep. Tambahkan bahan di bawah.</p>
                            ) : (
                                <div className="space-y-2">
                                    {ingredients.map(ing => (
                                        <div key={ing.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border">
                                            <div>
                                                <span className="font-medium">{ing.inventory_name}</span>
                                                <span className="text-sm text-gray-500 ml-2">({ing.quantity_required} {ing.unit})</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleRemoveIngredient(ing.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Ingredient */}
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                            <h4 className="text-sm font-bold text-primary">Tambah Bahan Baku</h4>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newIngId}
                                    onChange={e => setNewIngId(e.target.value)}
                                >
                                    <option value="">-- Pilih Bahan --</option>
                                    {inventory.map(inv => (
                                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    className="w-24"
                                    value={newIngQty}
                                    onChange={e => setNewIngQty(e.target.value)}
                                />
                                <Button onClick={handleAddIngredient} disabled={!newIngId || !newIngQty}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
