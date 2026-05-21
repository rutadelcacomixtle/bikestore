import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function CustomerLayout() {
  const { logout, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
        <span className="font-bold text-blue-700">CharlsBikes</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 truncate max-w-[120px]">
            {profile?.full_name}
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="px-4 py-6 max-w-xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
