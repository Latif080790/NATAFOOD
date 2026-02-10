import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import POS from '@/pages/POS'
import Kitchen from '@/pages/Kitchen'
import Orders from '@/pages/Orders'
import Inventory from '@/pages/Inventory'
import Settings from '@/pages/Settings'
import Scan from '@/pages/Scan'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/scan" element={<Scan />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
