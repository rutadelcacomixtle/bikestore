import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ClipboardList, ChevronRight, Filter } from 'lucide-react'
import { workOrderService, profileService, contactService, bicycleService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import BrandCombobox from '@/components/ui/BrandCombobox'
import brands from '@/data/bikeBrands.json'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'received', label: 'Recibida' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'ready', label: 'Lista' },
  { value: 'delivered', label: 'Entregada' },
]

function InlineForm({ title, children, onCancel, onSave, saving }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-blue-700">{title}</p>
      {children}
      <div className="flex gap-2 pt-0.5">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" size="sm" loading={saving} onClick={onSave} className="flex-1">
          Guardar
        </Button>
      </div>
    </div>
  )
}

function NewOrderForm({ onSave, onCancel, loading }) {
  const [customerType, setCustomerType] = useState('profile')
  const [profiles, setProfiles] = useState([])
  const [contacts, setContacts] = useState([])
  const [bikes, setBikes] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    contact_id:  '',
    bicycle_id:  '',
    description: '',
    diagnosis:   '',
    labor_cost:  '',
  })

  // inline creation
  const [inlineForm, setInlineForm] = useState(null) // null | 'contact' | 'bike'
  const [newContact, setNewContact] = useState({ full_name: '', phone: '' })
  const [newBike, setNewBike]       = useState({ brand: '', model: '' })
  const [inlineSaving, setInlineSaving] = useState(false)

  useEffect(() => {
    profileService.list().then(setProfiles)
    contactService.list().then(setContacts)
  }, [])

  useEffect(() => {
    setBikes([])
    setForm((p) => ({ ...p, bicycle_id: '' }))
    if (customerType === 'profile' && form.customer_id) {
      bicycleService.listByCustomer(form.customer_id).then(setBikes)
    } else if (customerType === 'contact' && form.contact_id) {
      bicycleService.listByContact(form.contact_id).then(setBikes)
    }
  }, [customerType, form.customer_id, form.contact_id])

  const setField = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const switchType = (val) => {
    setCustomerType(val)
    setInlineForm(null)
    setForm((p) => ({ ...p, customer_id: '', contact_id: '', bicycle_id: '' }))
  }

  const handleSaveContact = async () => {
    if (!newContact.full_name.trim()) return
    setInlineSaving(true)
    try {
      const contact = await contactService.create({
        full_name: newContact.full_name.trim(),
        phone:     newContact.phone || null,
      })
      setContacts((prev) =>
        [...prev, contact].sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
      )
      setForm((p) => ({ ...p, contact_id: contact.id }))
      setInlineForm(null)
      setNewContact({ full_name: '', phone: '' })
    } catch (err) {
      console.error(err)
    } finally {
      setInlineSaving(false)
    }
  }

  const handleSaveBike = async () => {
    if (!newBike.brand.trim() || !newBike.model.trim()) return
    setInlineSaving(true)
    try {
      const payload = customerType === 'contact'
        ? { ...newBike, contact_id: form.contact_id }
        : { ...newBike, customer_id: form.customer_id }
      const bike = await bicycleService.create(payload)
      setBikes((prev) => [...prev, bike])
      setForm((p) => ({ ...p, bicycle_id: bike.id }))
      setInlineForm(null)
      setNewBike({ brand: '', model: '' })
    } catch (err) {
      console.error(err)
    } finally {
      setInlineSaving(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      customer_id: customerType === 'profile' ? form.customer_id : null,
      contact_id:  customerType === 'contact'  ? form.contact_id  : null,
      bicycle_id:  form.bicycle_id || null,
      description: form.description,
      diagnosis:   form.diagnosis,
      labor_cost:  form.labor_cost,
    })
  }

  const selectedId = customerType === 'profile' ? form.customer_id : form.contact_id
  const modelOptions = newBike.brand && brands[newBike.brand]
    ? brands[newBike.brand]
    : Object.values(brands).flat()

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>

      {/* Toggle tipo de cliente */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">Tipo de cliente</p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {[
            { val: 'profile', label: 'Registrado' },
            { val: 'contact', label: 'Del taller' },
          ].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => switchType(val)}
              className={`flex-1 py-2 text-center transition-colors font-medium ${
                customerType === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de cliente */}
      {customerType === 'profile' ? (
        <Select
          label="Cliente"
          value={form.customer_id}
          onChange={(val) => setForm((p) => ({ ...p, customer_id: val }))}
          placeholder="Selecciona un cliente"
          options={profiles.map((c) => ({ value: c.id, label: c.full_name }))}
        />
      ) : (
        <Select
          label="Contacto"
          value={form.contact_id}
          onChange={(val) => setForm((p) => ({ ...p, contact_id: val }))}
          placeholder="Selecciona un contacto"
          options={contacts.map((c) => ({ value: c.id, label: c.full_name }))}
        />
      )}

      {/* Alta rápida de contacto (solo tipo Del taller) */}
      {customerType === 'contact' && inlineForm !== 'contact' && (
        <button
          type="button"
          onClick={() => setInlineForm('contact')}
          className="text-sm text-blue-600 hover:text-blue-800 text-left -mt-1"
        >
          + Crear nuevo contacto
        </button>
      )}
      {inlineForm === 'contact' && (
        <InlineForm
          title="Nuevo contacto"
          onCancel={() => setInlineForm(null)}
          onSave={handleSaveContact}
          saving={inlineSaving}
        >
          <Input
            placeholder="Nombre completo *"
            value={newContact.full_name}
            onChange={(e) => setNewContact((p) => ({ ...p, full_name: e.target.value }))}
            autoFocus
          />
          <Input
            placeholder="Teléfono"
            type="tel"
            value={newContact.phone}
            onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
          />
        </InlineForm>
      )}

      {/* Selector de bicicleta */}
      <Select
        label="Bicicleta"
        value={form.bicycle_id}
        onChange={(val) => setForm((p) => ({ ...p, bicycle_id: val }))}
        placeholder={selectedId ? 'Selecciona una bici (opcional)' : 'Primero selecciona un cliente'}
        options={bikes.map((b) => ({ value: b.id, label: `${b.brand} ${b.model}` }))}
        disabled={!selectedId}
      />

      {/* Alta rápida de bicicleta */}
      {selectedId && inlineForm !== 'bike' && (
        <button
          type="button"
          onClick={() => setInlineForm('bike')}
          className="text-sm text-blue-600 hover:text-blue-800 text-left -mt-1"
        >
          + Agregar bicicleta
        </button>
      )}
      {inlineForm === 'bike' && (
        <InlineForm
          title="Nueva bicicleta"
          onCancel={() => setInlineForm(null)}
          onSave={handleSaveBike}
          saving={inlineSaving}
        >
          <div className="grid grid-cols-2 gap-2">
            <BrandCombobox
              value={newBike.brand}
              onChange={(val) => setNewBike((p) => ({ ...p, brand: val }))}
              options={Object.keys(brands)}
              placeholder="Marca *"
              autoFocus
            />
            <BrandCombobox
              value={newBike.model}
              onChange={(val) => setNewBike((p) => ({ ...p, model: val }))}
              options={modelOptions}
              placeholder="Modelo *"
            />
          </div>
        </InlineForm>
      )}

      <Textarea label="Descripción del trabajo" value={form.description} onChange={setField('description')} required />
      <Textarea label="Diagnóstico" value={form.diagnosis} onChange={setField('diagnosis')} />
      <Input
        label="Costo de mano de obra ($)"
        type="number"
        min="0"
        step="0.01"
        value={form.labor_cost}
        onChange={setField('labor_cost')}
        placeholder="0.00"
      />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Crear orden</Button>
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
        <Filter size={14} className="text-gray-400 shrink-0" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          className="flex-1"
        />
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
                  <StatusBadge status={o.status} paidAt={o.paid_at} />
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
