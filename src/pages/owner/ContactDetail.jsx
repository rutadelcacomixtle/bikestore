import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Bike, Trash2, ClipboardList,
  Pencil, MessageCircle, Link2, Search, User, ChevronRight,
} from 'lucide-react'
import { contactService, profileService, bicycleService, workOrderService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

// ─── Formulario de bicicleta ──────────────────────────────────────────────────

function BikeForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    brand:         initial.brand         ?? '',
    model:         initial.model         ?? '',
    serial_number: initial.serial_number ?? '',
    color:         initial.color         ?? '',
    notes:         initial.notes         ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Marca" value={form.brand} onChange={set('brand')} required />
        <Input label="Modelo" value={form.model} onChange={set('model')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="No. serie" value={form.serial_number} onChange={set('serial_number')} />
        <Input label="Color" value={form.color} onChange={set('color')} />
      </div>
      <Textarea label="Notas" value={form.notes} onChange={set('notes')} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Formulario de edición del contacto ───────────────────────────────────────

function EditContactForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    full_name: initial.full_name ?? '',
    phone:     initial.phone     ?? '',
    email:     initial.email     ?? '',
    notes:     initial.notes     ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre completo" value={form.full_name} onChange={set('full_name')} required />
      <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} />
      <Input label="Correo" type="email" value={form.email} onChange={set('email')} />
      <Textarea label="Notas" value={form.notes} onChange={set('notes')} rows={2} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Modal de vinculación ─────────────────────────────────────────────────────

function LinkModal({ contact, bikeCount, orderCount, onConfirm, onCancel, loading }) {
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    profileService.list().then(setProfiles).catch(console.error)
  }, [])

  const results = profiles.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    )
  })

  // ── Paso 2: confirmación ──────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-amber-800">¿Confirmar vinculación?</p>
          <p className="text-sm text-amber-700">
            El historial de <strong>{contact.full_name}</strong> se transferirá a la cuenta
            de <strong>{selected.full_name}</strong> y el contacto será eliminado.
            Esta acción no se puede deshacer.
          </p>
          {(bikeCount > 0 || orderCount > 0) && (
            <div className="text-xs text-amber-600 mt-0.5 flex flex-col gap-0.5">
              {bikeCount  > 0 && <span>• {bikeCount} bicicleta{bikeCount !== 1 ? 's' : ''}</span>}
              {orderCount > 0 && <span>• {orderCount} orden{orderCount !== 1 ? 'es' : ''} de trabajo</span>}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-0.5">Cuenta destino</p>
          <p className="font-medium text-gray-900">{selected.full_name}</p>
          {selected.email && <p className="text-xs text-gray-500">{selected.email}</p>}
          {selected.phone && <p className="text-xs text-gray-500">{selected.phone}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setSelected(null)} className="flex-1">
            Cambiar
          </Button>
          <Button onClick={() => onConfirm(selected.id)} loading={loading} className="flex-1">
            Confirmar
          </Button>
        </div>
      </div>
    )
  }

  // ── Paso 1: búsqueda ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Busca la cuenta registrada del cliente para unificar su historial.
        Puedes buscar por nombre o correo.
      </p>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
        ) : (
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="flex items-center gap-3 w-full text-left rounded-lg border border-gray-100 px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="bg-blue-100 text-blue-700 rounded-full p-1.5 shrink-0">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.full_name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {p.email ?? p.phone ?? '—'}
                </p>
              </div>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </button>
          ))
        )}
      </div>

      <Button type="button" variant="secondary" onClick={onCancel} className="w-full">
        Cancelar
      </Button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ContactDetail() {
  const { id: contactId } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [bikes, setBikes] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [bikeModal, setBikeModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [linkModal, setLinkModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)

  const load = async () => {
    try {
      const [c, b, o] = await Promise.all([
        contactService.get(contactId),
        bicycleService.listByContact(contactId),
        workOrderService.list({ contactId }),
      ])
      setContact(c)
      setBikes(b)
      setOrders(o)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [contactId])

  const handleAddBike = async (form) => {
    setSaving(true)
    try {
      await bicycleService.create({ ...form, contact_id: contactId })
      setBikeModal(false)
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
      console.error(err)
    }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      await contactService.update(contactId, {
        full_name: form.full_name,
        phone:     form.phone  || null,
        email:     form.email  || null,
        notes:     form.notes  || null,
      })
      setEditModal(false)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a ${contact.full_name}? Sus bicicletas y órdenes asociadas quedarán sin cliente.`)) return
    try {
      await contactService.delete(contactId)
      navigate(-1)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLink = async (profileId) => {
    setLinking(true)
    try {
      await contactService.mergeIntoProfile(contactId, profileId)
      setLinkModal(false)
      navigate(`/owner/customers/${profileId}`, { replace: true })
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLinking(false)
    }
  }

  const handleInvite = () => {
    const url = `${window.location.origin}/login`
    const msg = `Hola ${contact.full_name}, te invitamos a crear tu cuenta en CharlsBikes para consultar el historial de tu bicicleta: ${url}`
    if (contact.phone) {
      const digits = contact.phone.replace(/\D/g, '')
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      navigator.clipboard.writeText(msg)
      alert('Mensaje copiado al portapapeles.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    )
  }

  if (!contact) return null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700 -ml-1 py-1 px-1 rounded-lg"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{contact.full_name}</h1>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Sin cuenta</span>
          </div>
          {contact.phone && <p className="text-sm text-gray-500">{contact.phone}</p>}
          {contact.email && <p className="text-sm text-gray-500">{contact.email}</p>}
          {contact.notes && <p className="text-sm text-gray-400 mt-1 italic">{contact.notes}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditModal(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleInvite}
            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
            title={contact.phone ? 'Invitar por WhatsApp' : 'Copiar mensaje de invitación'}
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={() => setLinkModal(true)}
            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
            title="Vincular con cuenta registrada"
          >
            <Link2 size={16} />
          </button>
        </div>
      </div>

      {/* Bikes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Bicicletas</h2>
          <Button size="sm" onClick={() => setBikeModal(true)}>
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
                    <p className="font-medium text-gray-900">{b.brand} {b.model}</p>
                    {b.serial_number && <p className="text-xs text-gray-400">Serie: {b.serial_number}</p>}
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

      {/* Orders */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Órdenes de trabajo</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/owner/work-orders?contactId=${contactId}`)}
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

      {/* Danger zone */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={handleDelete}
          className="text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          Eliminar este contacto
        </button>
      </div>

      <Modal open={bikeModal} onClose={() => setBikeModal(false)} title="Nueva bicicleta">
        <BikeForm onSave={handleAddBike} onCancel={() => setBikeModal(false)} loading={saving} />
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar contacto">
        <EditContactForm
          initial={contact}
          onSave={handleEdit}
          onCancel={() => setEditModal(false)}
          loading={saving}
        />
      </Modal>

      <Modal open={linkModal} onClose={() => setLinkModal(false)} title="Vincular con cuenta">
        <LinkModal
          contact={contact}
          bikeCount={bikes.length}
          orderCount={orders.length}
          onConfirm={handleLink}
          onCancel={() => setLinkModal(false)}
          loading={linking}
        />
      </Modal>
    </div>
  )
}
