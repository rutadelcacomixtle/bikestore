import { useEffect, useState } from 'react'
import { Plus, Truck, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import { supplierService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'

// ─── Formulario ───────────────────────────────────────────────────────────────

function SupplierForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name:  initial.name  ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    notes: initial.notes ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
    >
      <Input label="Nombre" value={form.name} onChange={set('name')} required autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="Opcional" />
        <Input label="Email"    value={form.email} onChange={set('email')} placeholder="Opcional" type="email" />
      </div>
      <Textarea label="Notas" value={form.notes} onChange={set('notes')} rows={2} placeholder="Opcional" />
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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setSuppliers(await supplierService.list())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit   = (s)  => { setEditTarget(s);   setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const payload = {
        name:  form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      }
      if (editTarget) {
        await supplierService.update(editTarget.id, payload)
      } else {
        await supplierService.create(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!confirm(`¿Eliminar a "${s.name}"? Esta acción no borra el historial de compras.`)) return
    try {
      await supplierService.delete(s.id)
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck size={20} className="text-orange-600" />
          <h1 className="text-xl font-bold text-gray-900">Proveedores</h1>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Nuevo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay proveedores registrados</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {suppliers.map((s) => (
            <Card key={s.id} onClick={() => openEdit(s)}>
              <CardBody className="flex items-center gap-3">
                <div className="bg-orange-50 text-orange-600 rounded-xl p-2.5 shrink-0">
                  <Truck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {s.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone size={10} /> {s.phone}
                      </p>
                    )}
                    {s.email && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={10} /> {s.email}
                      </p>
                    )}
                    {s.notes && (
                      <p className="text-xs text-gray-400 italic truncate">{s.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(s) }}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s) }}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar proveedor' : 'Nuevo proveedor'}
      >
        <SupplierForm
          initial={editTarget ?? {}}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
