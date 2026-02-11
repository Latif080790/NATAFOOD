import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { MenuCard } from '@/components/MenuCard'
import { CartSidebar, type OrderType } from '@/components/CartSidebar'
import { useCartStore, type MenuItem } from '@/store/cartStore'
import { ProductDetailDialog } from '@/components/ProductDetailDialog'
import { CheckoutDialog } from '@/components/CheckoutDialog'
import { MobileCartDrawer, CartFAB } from '@/components/MobileCartDrawer'
import { OpenShiftDialog, CloseShiftDialog } from '@/components/ShiftDialog'
import { useShiftStore } from '@/store/shiftStore'
import { Search, Clock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import { supabase } from '@/lib/supabase'

interface OrderMeta {
    type: OrderType
    table?: string
    customerName?: string
    customerPhone?: string
}

export default function POS() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
    const [orderMeta, setOrderMeta] = useState<OrderMeta>({ type: 'dine-in' })

    // Shift
    const { activeShift, fetchActiveShift } = useShiftStore()
    const [showOpenShift, setShowOpenShift] = useState(false)
    const [showCloseShift, setShowCloseShift] = useState(false)

    // Data State
    const [categories, setCategories] = useState<string[]>(['All'])
    const [products, setProducts] = useState<MenuItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')

    const addItem = useCartStore((state) => state.addItem)

    // Fetch Data from Supabase
    useEffect(() => {
        fetchActiveShift()
        const fetchData = async () => {
            try {
                // Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('name')
                    .order('sort_order')

                if (catError) throw catError
                if (catData) {
                    setCategories(['All', ...catData.map(c => c.name)])
                }

                // Fetch Products with Category Name
                const { data: prodData, error: prodError } = await supabase
                    .from('products')
                    .select('*, categories(name)')
                    .eq('is_available', true)

                if (prodError) throw prodError

                if (prodData) {
                    const mappedProducts: MenuItem[] = prodData.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        category: p.categories?.name || 'Uncategorized',
                        image: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                        status: p.status
                    }))
                    setProducts(mappedProducts)
                }
            } catch (error) {
                console.error('Error fetching menu:', error)
                toast.error('Gagal memuat menu. Cek koneksi internet.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleAddToOrder = (item: MenuItem, qty: number, notes: string) => {
        addItem(item, qty, notes)
    }

    const handleCheckout = (meta: OrderMeta) => {
        setOrderMeta(meta)
        setIsCheckoutOpen(true)
    }

    const handleCheckoutSuccess = () => {
        setIsCheckoutOpen(false)
        setIsMobileCartOpen(false)
    }

    const filteredItems = products.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex overflow-hidden">
            {/* Menu Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Shift Banner */}
                {!activeShift ? (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between shrink-0">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Belum ada shift aktif. Buka shift untuk mulai.
                        </p>
                        <button
                            onClick={() => setShowOpenShift(true)}
                            className="text-sm font-bold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                            Buka Shift →
                        </button>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2 flex items-center justify-between shrink-0">
                        <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Shift aktif sejak {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button
                            onClick={() => setShowCloseShift(true)}
                            className="text-sm font-medium text-green-700 dark:text-green-300 hover:underline flex items-center gap-1"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Tutup Shift
                        </button>
                    </div>
                )}

                {/* Header */}
                <header className="h-20 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-sidebar-border/50">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Cari menu..."
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border-none rounded-lg w-full focus-visible:ring-2 focus-visible:ring-primary shadow-sm text-sm placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* Category Tabs */}
                <div className="px-4 md:px-8 py-4 shrink-0 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3">
                        {categories.map(cat => {
                            const isActive = selectedCategory === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/25 hover:scale-105"
                                            : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-zinc-700 hover:border-primary hover:text-primary dark:hover:text-primary"
                                    )}
                                >
                                    {cat === 'All' ? 'Semua Menu' : cat}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 md:pb-0">
                        {filteredItems.map(item => {
                            const cartItem = useCartStore.getState().items.find(i => i.id === item.id)
                            const qty = cartItem ? cartItem.quantity : 0

                            return (
                                <div key={item.id} className="h-full">
                                    <MenuCard
                                        item={item}
                                        onAdd={() => setSelectedProduct(item)}
                                        quantity={qty}
                                    />
                                </div>
                            )
                        })}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground">
                                <p className="text-lg">Menu tidak ditemukan.</p>
                                <p className="text-sm">Coba cari dengan kata kunci lain.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="hidden md:block w-96 h-full flex-shrink-0 bg-card border-l">
                <CartSidebar onCheckout={handleCheckout} />
            </div>

            <ProductDetailDialog
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={handleAddToOrder}
            />

            {/* Mobile Cart FAB + Drawer */}
            <div className="md:hidden">
                <CartFAB onClick={() => setIsMobileCartOpen(true)} />
                <MobileCartDrawer
                    isOpen={isMobileCartOpen}
                    onClose={() => setIsMobileCartOpen(false)}
                    onCheckout={() => {
                        setIsMobileCartOpen(false)
                        setIsCheckoutOpen(true)
                    }}
                />
            </div>

            <CheckoutDialog
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
                orderMeta={orderMeta}
            />

            {/* Shift Dialogs */}
            <OpenShiftDialog open={showOpenShift} onClose={() => { setShowOpenShift(false); fetchActiveShift() }} />
            <CloseShiftDialog open={showCloseShift} onClose={() => { setShowCloseShift(false); fetchActiveShift() }} />
        </div>
    )
}
