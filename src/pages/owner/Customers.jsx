import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, User, UserPlus } from 'lucide-react'
import { profileService, contactService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'

function NewContactForm({ onSave, onCancel, loading }) {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre completo" value={form.full_name} onChange={set('full_name')} required autoFocus />
      <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} />
      <Input label="Correo (opcional)" type="email" value={form.email} onChange={set('email')} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

export default function Customers() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const load = async (q = '') => {
    setLoading(true)
    try {
      const [profiles, contacts] = await Promise.all([
        profileService.list(q),
        contactService.list(q),
      ])
      const combined = [
        ...profiles.map((p) => ({ ...p, _kind: 'profile' })),
        ...contacts.map((c) => ({ ...c, _kind: 'contact' })),
      ].sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
      setItems(combined)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    load(q)
  }

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      const contact = await contactService.create({
        full_name: form.full_name,
        phone:     form.phone     || null,
        email:     form.email     || null,
      })
      setModalOpen(false)
      navigate(`/owner/contacts/${contact.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const goTo = (item) =>
    item._kind === 'profile'
      ? navigate(`/owner/customers/${item.id}`)
      : navigate(`/owner/contacts/${item.id}`)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <UserPlus size={14} /> Nuevo
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={`${item._kind}-${item.id}`} onClick={() => goTo(item)}>
              <CardBody className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${item._kind === 'profile' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  <User size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{item.full_name}</p>
                    {item._kind === 'contact' && (
                      <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Sin cuenta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {item.email ?? item.phone ?? '—'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <NewContactForm
          onSave={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
