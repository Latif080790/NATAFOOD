import { create } from 'zustand'

export interface StockItem {
    id: string
    name: string
    sku: string
    category: string
    unit: string
    currentStock: number
    minStock: number
    maxStock: number
    image: string
}

interface InventoryState {
    stock: StockItem[]
    updateStock: (id: string, newQuantity: number) => void
}

const INITIAL_STOCK: StockItem[] = [
    {
        id: '1',
        name: 'Whole Milk',
        sku: 'SKU-8921',
        category: 'Dairy',
        unit: 'Liters',
        currentStock: 24,
        minStock: 5,
        maxStock: 28,
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&auto=format&fit=crop&q=60'
    },
    {
        id: '2',
        name: 'Dark Choco Chips',
        sku: 'SKU-4402',
        category: 'Dry Goods',
        unit: 'Kg',
        currentStock: 4.2,
        minStock: 3,
        maxStock: 12,
        image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200&auto=format&fit=crop&q=60'
    },
    {
        id: '3',
        name: 'Strawberries',
        sku: 'SKU-1022',
        category: 'Fresh',
        unit: 'Kg',
        currentStock: 0.5,
        minStock: 2,
        maxStock: 10,
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&auto=format&fit=crop&q=60'
    },
    {
        id: '4',
        name: 'Vanilla Syrup',
        sku: 'SKU-7721',
        category: 'Syrups',
        unit: 'Bottles',
        currentStock: 12,
        minStock: 3,
        maxStock: 13,
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&auto=format&fit=crop&q=60'
    },
    {
        id: '5',
        name: 'Pastry Flour',
        sku: 'SKU-2399',
        category: 'Dry Goods',
        unit: 'Kg',
        currentStock: 30,
        minStock: 10,
        maxStock: 50,
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&auto=format&fit=crop&q=60'
    },
    {
        id: '6',
        name: '12oz Paper Cups',
        sku: 'SKU-9001',
        category: 'Packaging',
        unit: 'Units',
        currentStock: 150,
        minStock: 100,
        maxStock: 375,
        image: 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=200&auto=format&fit=crop&q=60'
    }
]

export const useInventoryStore = create<InventoryState>((set) => ({
    stock: INITIAL_STOCK,
    updateStock: (id, newQuantity) => set((state) => ({
        stock: state.stock.map((item) =>
            item.id === id ? { ...item, currentStock: Math.max(0, newQuantity) } : item
        )
    })),
}))
