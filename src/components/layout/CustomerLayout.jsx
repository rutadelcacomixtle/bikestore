import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function CustomerLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
        <button onClick={() => navigate('/my-bikes')}>
          <img src="/logo.png" alt="Bike Store" className="h-7" />
        </button>
        <button
          onClick={() => navigate('/my-bikes/profile')}
          className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold"
        >
          {getInitials(profile?.full_name)}
        </button>
      </header>
      <main className="px-4 py-6 max-w-xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
