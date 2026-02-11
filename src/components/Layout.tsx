import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, ChefHat, History, Package, Settings, Menu, ScanLine, LogOut, PieChart, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
    { icon: ChefHat, label: 'Kitchen', path: '/kitchen' },
    { icon: History, label: 'Orders', path: '/orders' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Calculator, label: 'BOM / HPP', path: '/hpp' },
    { icon: PieChart, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Settings', path: '/settings' },
]

// Mobile bottom nav items (5 tabs + center Scan FAB)
const MOBILE_LEFT = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
]
const MOBILE_RIGHT = [
    { icon: ChefHat, label: 'Kitchen', path: '/kitchen' },
    { icon: History, label: 'Orders', path: '/orders' },
]
const MOBILE_MORE = [
    { icon: Package, label: 'Stock', path: '/inventory' },
    { icon: Calculator, label: 'BOM / HPP', path: '/hpp' },
    { icon: PieChart, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Settings', path: '/settings' },
]

const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
}

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const location = useLocation()

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop/Tablet Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r bg-card transition-all duration-300",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="p-4 flex items-center justify-between border-b h-16">
                    <h1
                        className={cn(
                            "font-bold text-xl text-primary truncate transition-all",
                            !isSidebarOpen && "scale-0 opacity-0 w-0"
                        )}
                    >
                        NataFood
                    </h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Main navigation">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link to={item.path} key={item.path}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-2",
                                        !isSidebarOpen && "justify-center px-0"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {isSidebarOpen && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10",
                            !isSidebarOpen && "justify-center px-0"
                        )}
                        onClick={async () => {
                            await useAuthStore.getState().signOut()
                            // AuthGuard will handle redirect, or we can force it
                            window.location.href = '/login'
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                        {isSidebarOpen && <span className="truncate">Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-auto bg-muted/20">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ─── Mobile Bottom Navigation ─── */}
                <nav
                    className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-gray-800 z-50 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)]"
                    aria-label="Mobile navigation"
                >
                    {/* More Menu Popover */}
                    <AnimatePresence>
                        {isMoreOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                                    onClick={() => setIsMoreOpen(false)}
                                />
                                {/* Menu */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full right-4 mb-3 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[160px]"
                                >
                                    {MOBILE_MORE.map(item => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMoreOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors",
                                                location.pathname === item.path
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    <div className="h-16 flex items-center justify-between px-4 pb-safe relative">
                        {/* Left: Home, POS */}
                        <div className="flex items-center gap-6">
                            {MOBILE_LEFT.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex flex-col items-center gap-0.5 transition-colors min-w-[44px]",
                                        location.pathname === item.path ? "text-primary" : "text-gray-400"
                                    )}
                                    aria-label={item.label}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Center FAB - Scan */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                            <Link to="/scan" aria-label="Scan QR Code">
                                <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center text-white border-4 border-white dark:border-zinc-900 transition-transform active:scale-95">
                                    <ScanLine className="w-6 h-6" />
                                </div>
                            </Link>
                        </div>

                        {/* Right: Kitchen, Orders, More */}
                        <div className="flex items-center gap-6">
                            {MOBILE_RIGHT.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex flex-col items-center gap-0.5 transition-colors min-w-[44px]",
                                        location.pathname === item.path ? "text-primary" : "text-gray-400"
                                    )}
                                    aria-label={item.label}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            ))}
                            {/* More button */}
                            <button
                                onClick={() => setIsMoreOpen(!isMoreOpen)}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 transition-colors min-w-[44px]",
                                    isMoreOpen || ['/inventory', '/settings'].includes(location.pathname) ? "text-primary" : "text-gray-400"
                                )}
                                aria-label="More pages"
                            >
                                <Menu className="w-6 h-6" />
                                <span className="text-[10px] font-medium">More</span>
                            </button>
                        </div>
                    </div>
                </nav>
            </main>
        </div>
    )
}
