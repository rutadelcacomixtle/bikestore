import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Bike, Trash2, ClipboardList, Pencil } from 'lucide-react'
import { profileService, bicycleService, workOrderService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import BrandCombobox from '@/components/ui/BrandCombobox'
import brands from '@/data/bikeBrands.json'

const brandNames = Object.keys(brands)

function EditProfileForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    full_name: initial.full_name ?? '',
    phone:     initial.phone     ?? '',
    email:     initial.email     ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre completo" value={form.full_name} onChange={set('full_name')} required />
      <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} />
      <Input label="Correo" type="email" value={form.email} onChange={set('email')} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

function BikeForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    brand: initial.brand ?? '',
    model: initial.model ?? '',
    serial_number: initial.serial_number ?? '',
    color: initial.color ?? '',
    notes: initial.notes ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const modelOptions = form.brand && brands[form.brand]
    ? brands[form.brand]
    : Object.values(brands).flat()

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
    >
      <div className="grid grid-cols-2 gap-3">
        <BrandCombobox
          label="Marca"
          value={form.brand}
          onChange={(val) => setForm((p) => ({ ...p, brand: val, model: '' }))}
          options={brandNames}
          required
        />
        <BrandCombobox
          label="Modelo"
          value={form.model}
          onChange={(val) => setForm((p) => ({ ...p, model: val }))}
          options={modelOptions}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="No. serie" value={form.serial_number} onChange={set('serial_number')} />
        <Input label="Color" value={form.color} onChange={set('color')} />
      </div>
      <Textarea label="Notas" value={form.notes} onChange={set('notes')} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Guardar
        </Button>
      </div>
    </form>
  )
}

export default function CustomerDetail() {
  const { id: customerId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [bikes, setBikes] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [p, b, o] = await Promise.all([
        profileService.get(customerId),
        bicycleService.listByCustomer(customerId),
        workOrderService.list({ customerId }),
      ])
      setProfile(p)
      setBikes(b)
      setOrders(o)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [customerId])

  const handleAddBike = async (form) => {
    setSaving(true)
    try {
      await bicycleService.create({ ...form, customer_id: customerId })
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditProfile = async (form) => {
    setSaving(true)
    try {
      await profileService.update(customerId, {
        full_name: form.full_name,
        phone:     form.phone  || null,
        email:     form.email  || null,
      })
      setEditModal(false)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBike = async (id) => {
    if (!confirm('¿Eliminar esta bicicleta?')) return
    try {
      await bicycleService.delete(id)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700 -ml-1 py-1 px-1 rounded-lg"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{profile?.full_name}</h1>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
        </div>
        <button
          onClick={() => setEditModal(true)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          title="Editar perfil"
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* Bikes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Bicicletas</h2>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
        {bikes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin bicicletas registradas</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bikes.map((b) => (
              <Card key={b.id}>
                <CardBody className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-700 rounded-xl p-2">
                    <Bike size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {b.brand} {b.model}
                    </p>
                    {b.serial_number && (
                      <p className="text-xs text-gray-400">Serie: {b.serial_number}</p>
                    )}
                    {b.color && <p className="text-xs text-gray-400">Color: {b.color}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteBike(b.id)}
                    className="p-2 -mr-2 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Work Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Órdenes de trabajo</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/owner/work-orders?customerId=${customerId}`)}
          >
            <ClipboardList size={14} /> Ver todas
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin órdenes de trabajo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map((o) => (
              <Card key={o.id} onClick={() => navigate(`/owner/work-orders/${o.id}`)}>
                <CardBody className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{o.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva bicicleta">
        <BikeForm
          onSave={handleAddBike}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar perfil">
        <EditProfileForm
          initial={profile}
          onSave={handleEditProfile}
          onCancel={() => setEditModal(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
