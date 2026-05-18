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
import MyBikes from '@/pages/customer/MyBikes'

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
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/:id" element={<WorkOrderDetail />} />
            <Route path="products" element={<Products />} />
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

          {/* Redireccion raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
