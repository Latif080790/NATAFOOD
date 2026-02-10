import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on our Schema
export type Category = {
    id: string
    name: string
    icon: string
    sort_order: number
}

export type Product = {
    id: string
    category_id: string
    name: string
    description?: string
    price: number
    image_url: string
    status: 'available' | 'cooking' | 'sold_out'
    is_available: boolean
}

export type InventoryItem = {
    id: string
    name: string
    sku: string
    category: string
    current_stock: number
    unit: string
    min_stock: number
    max_stock: number
    image_url: string
}
