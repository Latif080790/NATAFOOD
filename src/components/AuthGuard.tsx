import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading, initialized, initialize } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!initialized) {
            initialize()
        }
    }, [initialized, initialize])

    useEffect(() => {
        if (initialized && !isLoading && !session) {
            navigate('/login')
        }
    }, [session, isLoading, initialized, navigate])

    if (isLoading || !initialized) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-gray-500 font-medium">Memuat sesi...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect via useEffect
    }

    return <>{children}</>
}
