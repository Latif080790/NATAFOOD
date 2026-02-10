import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/ui/toast'
import Dashboard from '@/pages/Dashboard'
import POS from '@/pages/POS'
import Kitchen from '@/pages/Kitchen'
import Orders from '@/pages/Orders'
import Inventory from '@/pages/Inventory'
import Settings from '@/pages/Settings'
import Scan from '@/pages/Scan'
import Login from '@/pages/Login'
import CustomerDisplay from '@/pages/CustomerDisplay' // Added
import AuthGuard from '@/components/AuthGuard'
import { useCartStore } from '@/store/cartStore' // Added
import { supabase } from '@/lib/supabase' // Added
import { useEffect } from 'react' // Added

// Broadcast Hook
function CartBroadcaster() {
  const { items, total } = useCartStore()

  // Debounce broadcast
  useEffect(() => {
    const channel = supabase.channel('customer-display')

    const broadcast = async () => {
      await channel.subscribe()
      await channel.send({
        type: 'broadcast',
        event: 'cart-update',
        payload: { items, total: total() }
      })
    }

    const timeout = setTimeout(() => {
      broadcast()
    }, 300)

    return () => clearTimeout(timeout)
  }, [items, total]) // Re-run when cart changes

  return null
}

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <Router>
        <CartBroadcaster />
        <Routes>
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/customer" element={<ErrorBoundary><CustomerDisplay /></ErrorBoundary>} />

          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/pos" element={<ErrorBoundary><POS /></ErrorBoundary>} />
            <Route path="/kitchen" element={<ErrorBoundary><Kitchen /></ErrorBoundary>} />
            <Route path="/orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
            <Route path="/inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="/scan" element={<ErrorBoundary><Scan /></ErrorBoundary>} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
