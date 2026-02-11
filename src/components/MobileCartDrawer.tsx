import { useCartStore } from '@/store/cartStore'
import { CartSidebar } from '@/components/CartSidebar'
import { ShoppingBag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileCartDrawerProps {
    isOpen: boolean
    onClose: () => void
    onCheckout: () => void
}

export function MobileCartDrawer({ isOpen, onClose, onCheckout }: MobileCartDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center py-3 shrink-0">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            aria-label="Close cart"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {/* Cart content */}
                        <div className="flex-1 overflow-y-auto">
                            <CartSidebar onCheckout={() => onCheckout()} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

/** Floating Action Button for mobile — shows cart item count */
export function CartFAB({ onClick }: { onClick: () => void }) {
    const items = useCartStore(s => s.items)
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

    if (totalQty === 0) return null

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(
                "fixed bottom-20 right-4 z-[55] w-14 h-14 rounded-full shadow-xl flex items-center justify-center",
                "bg-primary text-white hover:bg-orange-600 transition-colors",
                "shadow-primary/30"
            )}
            aria-label={`Open cart (${totalQty} items)`}
        >
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                {totalQty}
            </span>
        </motion.button>
    )
}
