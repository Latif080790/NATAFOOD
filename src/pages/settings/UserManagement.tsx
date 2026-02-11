import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Plus, User, Shield, Trash2 } from 'lucide-react'
import { toast } from '@/store/toastStore'
// Removed date-fns

interface Profile {
    id: string
    full_name: string
    role: 'admin' | 'cashier' | 'kitchen' | 'waiter'
    created_at: string
    email?: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching users:', error)
            toast.error('Gagal memuat data pengguna.')
        } else {
            setUsers(data as Profile[] || [])
        }
        setIsLoading(false)
    }

    const handleInvite = () => {
        toast.info('Fitur invite user akan segera hadir via Supabase Edge Function!')
    }

    // Native date formatter
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold">Manajemen Pengguna</h2>
                    <p className="text-sm text-muted-foreground">Kelola staf dan hak akses (Role).</p>
                </div>
                <Button onClick={handleInvite}>
                    <Plus className="w-4 h-4 mr-2" />
                    Undang User
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20 space-y-3">
                    <User className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Belum ada data profile.</p>
                    <p className="text-xs text-muted-foreground">User baru akan otomatis muncul di sini setelah login pertama kali.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm divide-y">
                    {users.map(user => (
                        <div key={user.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{user.full_name || 'Unnamed User'}</p>
                                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{user.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        user.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    <Shield className="w-3 h-3" />
                                    {user.role}
                                </span>
                                <p className="text-xs text-muted-foreground hidden md:block">
                                    Join: {formatDate(user.created_at)}
                                </p>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
