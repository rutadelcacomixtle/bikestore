import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Users, Package, Clock, Wrench, CheckCircle } from 'lucide-react'
import { statsService } from '@/lib/supabase'
import { Card, CardBody } from '@/components/ui/Card'

function StatCard({ label, value, icon: Icon, color, onClick }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green:  'bg-green-50 text-green-700',
    gray:   'bg-gray-100 text-gray-700',
  }
  return (
    <Card onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <CardBody className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
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
      <h1 className="text-xl font-bold text-gray-900 mb-5">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Resumen general
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Total órdenes"
                value={stats?.totalOrders}
                icon={ClipboardList}
                color="blue"
                onClick={() => navigate('/owner/work-orders')}
              />
              <StatCard
                label="Clientes"
                value={stats?.totalCustomers}
                icon={Users}
                color="gray"
                onClick={() => navigate('/owner/customers')}
              />
              <StatCard
                label="Productos activos"
                value={stats?.activeProducts}
                icon={Package}
                color="green"
                onClick={() => navigate('/owner/products')}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Estado de órdenes
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Recibidas"
                value={stats?.pending}
                icon={Clock}
                color="gray"
              />
              <StatCard
                label="En proceso"
                value={stats?.inProgress}
                icon={Wrench}
                color="yellow"
              />
              <StatCard
                label="Listas"
                value={stats?.ready}
                icon={CheckCircle}
                color="green"
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
