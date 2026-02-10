import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { MenuItem } from '@/store/cartStore'
import { Input } from '@/components/ui/input'
import { Plus, Minus } from 'lucide-react'

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <label className={"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 " + className}>{children}</label>
}

interface ProductDetailDialogProps {
    isOpen: boolean
    onClose: () => void
    product: MenuItem | null
    onAddToCart: (item: MenuItem, quantity: number, notes: string) => void
}

export function ProductDetailDialog({ isOpen, onClose, product, onAddToCart }: ProductDetailDialogProps) {
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')
    // Mock options
    const [sugarLevel, setSugarLevel] = useState('Normal')
    const [iceLevel, setIceLevel] = useState('Normal')

    useEffect(() => {
        if (isOpen) {
            setQuantity(1)
            setNotes('')
            setSugarLevel('Normal')
            setIceLevel('Normal')
        }
    }, [isOpen, product])

    if (!product) return null

    const handleAdd = () => {
        const finalNotes = [notes, `Sugar: ${sugarLevel}`, `Ice: ${iceLevel}`].filter(Boolean).join(', ')
        onAddToCart(product, quantity, finalNotes)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Order">
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl">{product.name}</h2>
                        <p className="text-primary font-bold text-lg">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Sugar Level</Label>
                        <div className="flex gap-2">
                            {['None', 'Less', 'Normal', 'Extra'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setSugarLevel(level)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${sugarLevel === level ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ice Level</Label>
                        <div className="flex gap-2">
                            {['None', 'Less', 'Normal', 'Extra'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setIceLevel(level)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${iceLevel === level ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Catatan Tambahan</Label>
                        <Input
                            placeholder="Contoh: Jangan pakai bawang..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button size="lg" className="px-8 font-bold" onClick={handleAdd}>
                        Add to Order - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price * quantity)}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
