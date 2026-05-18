import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ClipboardList, ChevronRight, Filter } from 'lucide-react'
import { workOrderService, profileService, bicycleService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'received', label: 'Recibida' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'ready', label: 'Lista' },
  { value: 'delivered', label: 'Entregada' },
]

function NewOrderForm({ onSave, onCancel, loading }) {
  const [customers, setCustomers] = useState([])
  const [bikes, setBikes] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    bicycle_id: '',
    description: '',
    diagnosis: '',
    labor_cost: '',
  })

  useEffect(() => { profileService.list().then(setCustomers) }, [])

  useEffect(() => {
    if (!form.customer_id) { setBikes([]); return }
    bicycleService.listByCustomer(form.customer_id).then(setBikes)
  }, [form.customer_id])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
    >
      <Select label="Cliente" value={form.customer_id} onChange={set('customer_id')} required>
        <option value="">Selecciona un cliente</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.full_name}</option>
        ))}
      </Select>
      <Select
        label="Bicicleta"
        value={form.bicycle_id}
        onChange={set('bicycle_id')}
        required
        disabled={!form.customer_id}
      >
        <option value="">Selecciona una bici</option>
        {bikes.map((b) => (
          <option key={b.id} value={b.id}>{b.brand} {b.model}</option>
        ))}
      </Select>
      <Textarea label="Descripción del trabajo" value={form.description} onChange={set('description')} required />
      <Textarea label="Diagnóstico" value={form.diagnosis} onChange={set('diagnosis')} />
      <Input
        label="Costo de mano de obra ($)"
        type="number"
        min="0"
        step="0.01"
        value={form.labor_cost}
        onChange={set('labor_cost')}
        placeholder="0.00"
      />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Crear orden
        </Button>
      </div>
    </form>
  )
}

export default function WorkOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerIdFilter = searchParams.get('customerId') ?? ''

  const load = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (customerIdFilter) filters.customerId = customerIdFilter
      setOrders(await workOrderService.list(filters))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, customerIdFilter])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      const order = await workOrderService.create({
        ...form,
        labor_cost: parseFloat(form.labor_cost) || 0,
      })
      setModalOpen(false)
      navigate(`/owner/work-orders/${order.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Órdenes</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nueva
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay órdenes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((o) => (
            <Card key={o.id} onClick={() => navigate(`/owner/work-orders/${o.id}`)}>
              <CardBody className="flex items-center gap-3">
                <ClipboardList size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva orden de trabajo">
        <NewOrderForm
          onSave={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
