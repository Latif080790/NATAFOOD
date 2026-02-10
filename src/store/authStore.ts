import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast as customToast } from './toastStore'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
    session: Session | null
    user: User | null
    isLoading: boolean
    initialized: boolean

    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isLoading: false,
    initialized: false,

    initialize: async () => {
        try {
            // Get initial session
            const { data: { session } } = await supabase.auth.getSession()
            set({
                session,
                user: session?.user ?? null,
                initialized: true
            })

            // Listen for changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session?.user ?? null
                })
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
            set({ initialized: true })
        }
    },

    signIn: async (email, password) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error
            customToast.success('Login berhasil! Selamat datang.')
            return { error: null }
        } catch (error: any) {
            console.error('Login error:', error)
            customToast.error(error.message || 'Login gagal')
            return { error }
        } finally {
            set({ isLoading: false })
        }
    },

    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            customToast.success('Logout berhasil')
            set({ session: null, user: null })
        } catch (error) {
            console.error('Logout error:', error)
            customToast.error('Gagal logout')
        }
    }
}))
