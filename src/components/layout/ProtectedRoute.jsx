import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role === 'owner' && profile?.role !== 'owner') {
    return <Navigate to="/my-bikes" replace />
  }

  if (role === 'customer' && profile?.role !== 'customer') {
    return <Navigate to="/owner/dashboard" replace />
  }

  return children
}
