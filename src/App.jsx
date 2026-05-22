import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { OwnerLayout } from '@/components/layout/OwnerLayout'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/owner/Dashboard'
import Customers from '@/pages/owner/Customers'
import CustomerDetail from '@/pages/owner/CustomerDetail'
import WorkOrders from '@/pages/owner/WorkOrders'
import WorkOrderDetail from '@/pages/owner/WorkOrderDetail'
import Products from '@/pages/owner/Products'
import Sales from '@/pages/owner/Sales'
import Finance from '@/pages/owner/Finance'
import Inventory from '@/pages/owner/Inventory'
import Suppliers from '@/pages/owner/Suppliers'
import ContactDetail from '@/pages/owner/ContactDetail'
import MyBikes from '@/pages/customer/MyBikes'
import { useAuth } from '@/hooks/useAuth'

function RootRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'owner') return <Navigate to="/owner/dashboard" replace />
  return <Navigate to="/my-bikes" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Público */}
          <Route path="/login" element={<Login />} />

          {/* Owner */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute role="owner">
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="contacts/:id"  element={<ContactDetail />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/:id" element={<WorkOrderDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="sales"     element={<Sales />} />
            <Route path="finance"   element={<Finance />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
          </Route>

          {/* Customer */}
          <Route
            path="/my-bikes"
            element={
              <ProtectedRoute role="customer">
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyBikes />} />
          </Route>

          {/* Redirección raíz — espera auth antes de decidir */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
