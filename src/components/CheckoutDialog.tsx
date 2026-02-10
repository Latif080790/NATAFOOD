import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useState } from 'react'

interface CheckoutDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CheckoutDialog({ isOpen, onClose, onSuccess }: CheckoutDialogProps) {
    const { total, clearCart } = useCartStore()
    const [method, setMethod] = useState<'qris' | 'cash' | null>(null)
    const cartTotal = total()

    const handlePay = () => {
        // Simulate API call
        setTimeout(() => {
            clearCart()
            onSuccess()
        }, 1000)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Checkout">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-muted-foreground">Total Tagihan</p>
                    <div className="text-4xl font-bold text-primary">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cartTotal)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant={method === 'qris' ? 'default' : 'outline'}
                        className="h-24 flex flex-col gap-2 text-lg"
                        onClick={() => setMethod('qris')}
                    >
                        <QrCode className="h-8 w-8" />
                        QRIS
                    </Button>
                    <Button
                        variant={method === 'cash' ? 'default' : 'outline'}
                        className="h-24 flex flex-col gap-2 text-lg"
                        onClick={() => setMethod('cash')}
                    >
                        <Banknote className="h-8 w-8" />
                        Tunai
                    </Button>
                </div>

                <Button size="lg" className="w-full text-xl font-bold h-14" disabled={!method} onClick={handlePay}>
                    Bayar Sekarang
                </Button>
            </div>
        </Modal>
    )
}
