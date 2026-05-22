import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Users, Package, Clock, Wrench, CheckCircle, ChevronRight, ShoppingCart, TrendingUp, Truck } from 'lucide-react'
import { statsService } from '@/lib/supabase'
import { Card, CardBody } from '@/components/ui/Card'

// Tarjeta de navegación grande — para el grid de accesos directos
function NavCard({ label, description, icon: Icon, color, onClick }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    teal:   'bg-teal-50 text-teal-700',
  }
  return (
    <Card onClick={onClick} className="cursor-pointer active:scale-95 transition-transform">
      <CardBody className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-400 truncate">{description}</p>}
        </div>
        <ChevronRight size={15} className="text-gray-300 shrink-0" />
      </CardBody>
    </Card>
  )
}

// Tarjeta de estado de orden — ancho completo, tappable, navega a órdenes filtradas
function StatusCard({ label, value, icon: Icon, color, status, navigate }) {
  const colors = {
    gray:   { icon: 'bg-gray-100 text-gray-500',    num: 'text-gray-800'   },
    yellow: { icon: 'bg-yellow-50 text-yellow-600', num: 'text-yellow-700' },
    green:  { icon: 'bg-green-50 text-green-600',   num: 'text-green-700'  },
  }
  const c = colors[color]
  return (
    <Card onClick={() => navigate(`/owner/work-orders?status=${status}`)} className="cursor-pointer">
      <CardBody className="flex items-center gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${c.icon}`}>
          <Icon size={18} />
        </div>
        <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-2xl font-bold ${c.num}`}>{value ?? '—'}</span>
        <ChevronRight size={15} className="text-gray-300 shrink-0" />
      </CardBody>
    </Card>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    statsService.getSummary()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Inicio</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : (
        <>
          {/* 1. Estado de órdenes — lo más accionable del día */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Órdenes activas
            </h2>
            <div className="flex flex-col gap-2">
              <StatusCard
                label="Recibidas"
                value={stats?.pending}
                icon={Clock}
                color="gray"
                status="received"
                navigate={navigate}
              />
              <StatusCard
                label="En proceso"
                value={stats?.inProgress}
                icon={Wrench}
                color="yellow"
                status="in_progress"
                navigate={navigate}
              />
              <StatusCard
                label="Listas para entregar"
                value={stats?.ready}
                icon={CheckCircle}
                color="green"
                status="ready"
                navigate={navigate}
              />
            </div>
          </section>

          {/* 2. Accesos directos */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Secciones
            </h2>
            <div className="flex flex-col gap-2">
              <NavCard
                label="Clientes"
                description={stats?.totalCustomers != null ? `${stats.totalCustomers} registrados` : undefined}
                icon={Users}
                color="gray"
                onClick={() => navigate('/owner/customers')}
              />
              <NavCard
                label="Órdenes de trabajo"
                description={stats?.totalOrders != null ? `${stats.totalOrders} en total` : undefined}
                icon={ClipboardList}
                color="blue"
                onClick={() => navigate('/owner/work-orders')}
              />
              <NavCard
                label="Productos"
                description={stats?.activeProducts != null ? `${stats.activeProducts} activos` : undefined}
                icon={Package}
                color="green"
                onClick={() => navigate('/owner/products')}
              />
              <NavCard
                label="Ventas"
                icon={ShoppingCart}
                color="orange"
                onClick={() => navigate('/owner/sales')}
              />
              <NavCard
                label="Inventario"
                description="Compras y entradas de stock"
                icon={Package}
                color="teal"
                onClick={() => navigate('/owner/inventory')}
              />
              <NavCard
                label="Proveedores"
                icon={Truck}
                color="orange"
                onClick={() => navigate('/owner/suppliers')}
              />
              <NavCard
                label="Finanzas"
                icon={TrendingUp}
                color="purple"
                onClick={() => navigate('/owner/finance')}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
