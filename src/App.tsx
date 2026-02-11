import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/ui/toast'
import Dashboard from '@/pages/Dashboard'
import POS from '@/pages/POS'
import Kitchen from '@/pages/Kitchen'
import Orders from '@/pages/Orders'
import Inventory from '@/pages/Inventory'
import StockOpname from '@/pages/inventory/StockOpname'
import StockOpnameForm from '@/pages/inventory/StockOpnameForm'
import Shift from '@/pages/Shift'
import Reports from '@/pages/Reports'


import Settings from '@/pages/Settings'
import Scan from '@/pages/Scan'
import Finance from '@/pages/Finance'
import Login from '@/pages/Login'
import HPP from '@/pages/HPP' // Added
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
            <Route path="/inventory/opname" element={<ErrorBoundary><StockOpname /></ErrorBoundary>} />
            <Route path="/inventory/opname/new" element={<ErrorBoundary><StockOpnameForm /></ErrorBoundary>} />
            <Route path="/inventory/opname/new" element={<ErrorBoundary><StockOpnameForm /></ErrorBoundary>} />
            <Route path="/inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
            <Route path="/shift" element={<ErrorBoundary><Shift /></ErrorBoundary>} />
            <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="/scan" element={<ErrorBoundary><Scan /></ErrorBoundary>} />
            <Route path="/finance" element={<ErrorBoundary><Finance /></ErrorBoundary>} />
            <Route path="/hpp" element={<ErrorBoundary><HPP /></ErrorBoundary>} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
