import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, ChefHat, History, Package, Settings, Menu, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
    { icon: ChefHat, label: 'Kitchen', path: '/kitchen' },
    { icon: History, label: 'Orders', path: '/orders' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
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
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-auto bg-muted/20">
                    <Outlet />
                </div>

                {/* Mobile Bottom Navigation (Visible only on small screens) */}
                {/* Mobile Bottom Navigation - App-like experience */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {/* Left Group */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className={cn("flex flex-col items-center gap-1 transition-colors", location.pathname === '/' ? "text-primary" : "text-gray-400")}>
                            <LayoutDashboard className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Home</span>
                        </Link>
                        <Link to="/pos" className={cn("flex flex-col items-center gap-1 transition-colors", location.pathname === '/pos' ? "text-primary" : "text-gray-400")}>
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-[10px] font-medium">POS</span>
                        </Link>
                    </div>

                    {/* Center FAB - Scan */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                        <Link to="/scan">
                            <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center text-white border-4 border-background transition-transform active:scale-95">
                                <ScanLine className="w-6 h-6" />
                            </div>
                        </Link>
                    </div>

                    {/* Right Group */}
                    <div className="flex items-center gap-8">
                        <Link to="/kitchen" className={cn("flex flex-col items-center gap-1 transition-colors", location.pathname === '/kitchen' ? "text-primary" : "text-gray-400")}>
                            <ChefHat className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Kitchen</span>
                        </Link>
                        <Link to="/inventory" className={cn("flex flex-col items-center gap-1 transition-colors", location.pathname === '/inventory' ? "text-primary" : "text-gray-400")}>
                            <Package className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Stock</span>
                        </Link>
                    </div>
                </nav>
            </main>
        </div>
    )
}
