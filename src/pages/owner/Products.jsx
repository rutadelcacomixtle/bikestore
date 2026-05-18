import { useEffect, useState } from 'react'
import { Plus, Package, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { productService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

function ProductForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    description: initial.description ?? '',
    price: initial.price ?? '',
    stock: initial.stock ?? '',
    category: initial.category ?? '',
    active: initial.active ?? true,
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
    >
      <Input label="Nombre" value={form.name} onChange={set('name')} required />
      <Textarea label="Descripción" value={form.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio ($)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
        <Input label="Stock" type="number" min="0" value={form.stock} onChange={set('stock')} required />
      </div>
      <Input label="Categoría" value={form.category} onChange={set('category')} />
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
          className="rounded"
        />
        Producto activo
      </label>
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

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setProducts(await productService.list())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (p) => { setEditTarget(p); setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) }
      if (editTarget) {
        await productService.update(editTarget.id, data)
      } else {
        await productService.create(data)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await productService.delete(id)
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggle = async (p) => {
    try {
      await productService.update(p.id, { active: !p.active })
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Nuevo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay productos</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    {!p.active && <Badge color="gray">Inactivo</Badge>}
                  </div>
                  {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                  <p className="text-xs text-gray-500">
                    ${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} · Stock: {p.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(p)}
                    className={`p-1.5 rounded-lg transition-colors ${p.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}
                  >
                    {p.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
        title={editTarget ? 'Editar producto' : 'Nuevo producto'}
      >
        <ProductForm
          initial={editTarget ?? {}}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
