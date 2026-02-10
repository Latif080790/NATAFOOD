import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { MenuCard } from '@/components/MenuCard'
import { CartSidebar } from '@/components/CartSidebar'
import { useCartStore, type MenuItem } from '@/store/cartStore'
import { ProductDetailDialog } from '@/components/ProductDetailDialog'
import { CheckoutDialog } from '@/components/CheckoutDialog'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock Data
const MENU_ITEMS: MenuItem[] = [
    {
        id: '1',
        name: 'Nasi Goreng Spesial',
        category: 'Main Course',
        price: 25000,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '2',
        name: 'Ayam Bakar Madu',
        category: 'Main Course',
        price: 30000,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '3',
        name: 'Es Teler Sultan',
        category: 'Drinks',
        price: 18000,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '4',
        name: 'Pudding Coklat Lumer',
        category: 'Dessert',
        price: 15000,
        status: 'cooking',
        image: 'https://images.unsplash.com/photo-1549405625-2b6271c77840?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '5',
        name: 'Es Teh Manis Jumbo',
        category: 'Drinks',
        price: 5000,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60'
    }
]

export default function POS() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const addItem = useCartStore((state) => state.addItem)

    const handleAddToOrder = (item: MenuItem, qty: number, notes: string) => {
        addItem(item, qty, notes)
    }

    const handleCheckoutSuccess = () => {
        setIsCheckoutOpen(false)
        // Maybe show success toast
        alert("Pembayaran Berhasil! Struk dicetak.")
    }

    const filteredItems = MENU_ITEMS.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen flex overflow-hidden">
            {/* Menu Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-20 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-sidebar-border/50">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Category</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search menu..."
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
                        {['All', 'Main Course', 'Drinks', 'Dessert'].map(cat => {
                            const isActive = (searchQuery === '' && cat === 'All') || searchQuery === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSearchQuery(cat === 'All' ? '' : cat)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/25 hover:scale-105"
                                            : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-zinc-700 hover:border-primary hover:text-primary dark:hover:text-primary"
                                    )}
                                >
                                    {cat === 'All' ? 'All Menu' : cat}
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
                                <p className="text-lg">No menu items found.</p>
                                <p className="text-sm">Try a different search or category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="hidden md:block w-96 h-full flex-shrink-0 bg-card border-l">
                {/* We need to pass toggle function to CartSidebar to open checkout */}
                {/* For now, CartSidebar has internal button. We need to extract handleCheckout to props if we want to control it here, or just wrap CartSidebar to intercept click.
            Actually, let's modify CartSidebar to accept onCheckout prop. 
            Or better, let's just make CartSidebar local state if needed.
            But CartSidebar is separate file. 
            I will modify CartSidebar to accept props, OR I will duplicate the simple cart logic here to save file jumping?
            No, better to just edit CartSidebar.
            Wait, I haven't edited CartSidebar to accept props. 
            I will recreate CartSidebar inside POS using the code from `src/components/CartSidebar.tsx` but adapted, or just update `CartSidebar.tsx` to accept the prop.
            
            Let's update CartSidebar.tsx to accept `onCheckout`.
         */}
                <CartSidebar onCheckout={() => setIsCheckoutOpen(true)} />
            </div>

            <ProductDetailDialog
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={handleAddToOrder}
            />

            <CheckoutDialog
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    )
}
