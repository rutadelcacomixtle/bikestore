import { useEffect, useState } from 'react'
import { Bike, ChevronDown, ChevronUp } from 'lucide-react'
import { bicycleService, workOrderService } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

function BikeCard({ bike }) {
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleOrders = async () => {
    setOpen((o) => !o)
    if (!open && orders.length === 0) {
      setLoading(true)
      try {
        const all = await workOrderService.list({ customerId: bike.customer_id })
        setOrders(all.filter((o) => o.bicycle_id === bike.id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardBody className="flex items-center gap-3">
        <div className="bg-blue-50 text-blue-700 rounded-xl p-2.5">
          <Bike size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {bike.brand} {bike.model}
          </p>
          {bike.serial_number && (
            <p className="text-xs text-gray-400">Serie: {bike.serial_number}</p>
          )}
          {bike.color && <p className="text-xs text-gray-400">Color: {bike.color}</p>}
        </div>
        <button
          onClick={toggleOrders}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </CardBody>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Historial de reparaciones
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Sin historial</p>
          ) : (
            <div className="flex flex-col gap-2">
              {orders.map((o) => (
                <div key={o.id} className="bg-white rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-gray-800 font-medium">{o.description}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.diagnosis && (
                    <p className="text-xs text-gray-500 mb-1">{o.diagnosis}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(o.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function MyBikes() {
  const { user } = useAuth()
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    bicycleService.listByCustomer(user.id)
      .then(setBikes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Mis bicicletas</h1>
      <p className="text-sm text-gray-500 mb-5">
        Aquí puedes ver el historial de reparaciones de tus bicicletas.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : bikes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bike size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tienes bicicletas registradas</p>
          <p className="text-xs mt-1">Visita el taller para registrar tu bici</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bikes.map((b) => <BikeCard key={b.id} bike={b} />)}
        </div>
      )}
    </div>
  )
}
