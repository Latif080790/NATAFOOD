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

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <Router>
        <Routes>
          <Route element={<Layout />}>
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
