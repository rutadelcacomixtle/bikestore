import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, Package, ShoppingCart, TrendingUp, Truck, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/owner/dashboard',   icon: LayoutDashboard, label: 'Inicio'      },
  { to: '/owner/customers',   icon: Users,            label: 'Clientes'    },
  { to: '/owner/work-orders', icon: ClipboardList,    label: 'Órdenes'     },
  { to: '/owner/products',    icon: Package,          label: 'Productos'   },
  { to: '/owner/sales',       icon: ShoppingCart,     label: 'Ventas'      },
  { to: '/owner/inventory',   icon: Package,          label: 'Inventario'  },
  { to: '/owner/suppliers',   icon: Truck,            label: 'Proveedores' },
  { to: '/owner/finance',     icon: TrendingUp,       label: 'Finanzas'    },
]

const mobileNavItems = [
  { to: '/owner/dashboard',   icon: LayoutDashboard, label: 'Inicio'  },
  { to: '/owner/work-orders', icon: ClipboardList,    label: 'Órdenes' },
]

export function OwnerLayout() {
  const { logout, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header desktop */}
      <header className="hidden sm:flex items-center justify-between bg-white border-b border-gray-200 px-6 h-14 shrink-0">
        <img src="/logo.png" alt="Bike Store" className="h-8" />
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Salir
        </button>
      </header>

      {/* Mobile header */}
      <header className="sm:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 shrink-0">
        <img src="/logo.png" alt="Bike Store" className="h-7" />
        <span className="text-xs text-gray-500 truncate max-w-[140px]">
          {profile?.full_name}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-blue-700' : 'text-gray-400'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium text-gray-400"
        >
          <LogOut size={20} />
          Salir
        </button>
      </nav>
    </div>
  )
}
