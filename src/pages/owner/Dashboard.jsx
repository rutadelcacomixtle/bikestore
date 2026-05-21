import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Users, Package, Clock, Wrench, CheckCircle, ChevronRight } from 'lucide-react'
import { statsService } from '@/lib/supabase'
import { Card, CardBody } from '@/components/ui/Card'

// Tarjeta de resumen — cuadrada, para el grid de 2 columnas
function SummaryCard({ label, value, icon: Icon, color, onClick }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray:  'bg-gray-100 text-gray-600',
  }
  return (
    <Card onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <CardBody className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        </div>
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

          {/* 2. Resumen general */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Resumen
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="Total órdenes"
                value={stats?.totalOrders}
                icon={ClipboardList}
                color="blue"
                onClick={() => navigate('/owner/work-orders')}
              />
              <SummaryCard
                label="Clientes"
                value={stats?.totalCustomers}
                icon={Users}
                color="gray"
                onClick={() => navigate('/owner/customers')}
              />
              {/* Última tarjeta ocupa todo el ancho para evitar el grid descuadrado */}
              <div className="col-span-2">
                <SummaryCard
                  label="Productos activos"
                  value={stats?.activeProducts}
                  icon={Package}
                  color="green"
                  onClick={() => navigate('/owner/products')}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
