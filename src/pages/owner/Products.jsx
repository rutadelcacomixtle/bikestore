import { useEffect, useState } from 'react'
import { Plus, Package, Pencil, Trash2, ToggleLeft, ToggleRight, Tags, AlertTriangle, Search } from 'lucide-react'
import { productService, categoryService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const UNITS = [
  { value: 'pieza',  label: 'Pieza'  },
  { value: 'par',    label: 'Par'    },
  { value: 'set',    label: 'Set'    },
  { value: 'litro',  label: 'Litro'  },
  { value: 'metro',  label: 'Metro'  },
  { value: 'frasco', label: 'Frasco' },
]

// ─── Category form ────────────────────────────────────────────────────────────

function CategoryForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name:        initial.name        ?? '',
    description: initial.description ?? '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre" value={form.name} onChange={set('name')} required autoFocus />
      <Textarea label="Descripción" value={form.description} onChange={set('description')} rows={2} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Category manager ─────────────────────────────────────────────────────────

function CategoryManager({ categories, products, onRefresh }) {
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const countFor = (catId) => products.filter((p) => p.category_id === catId).length

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editTarget?.id) {
        await categoryService.update(editTarget.id, form)
      } else {
        await categoryService.create({ ...form, sort_order: categories.length + 1 })
      }
      await onRefresh()
      setEditTarget(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat) => {
    const n = countFor(cat.id)
    const msg = n > 0
      ? `¿Eliminar "${cat.name}"? ${n} producto${n !== 1 ? 's' : ''} quedarán sin categoría.`
      : `¿Eliminar "${cat.name}"?`
    if (!confirm(msg)) return
    try {
      await categoryService.delete(cat.id)
      await onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  if (editTarget !== null) {
    return (
      <CategoryForm
        initial={editTarget}
        onSave={handleSave}
        onCancel={() => setEditTarget(null)}
        loading={saving}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {categories.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin categorías</p>
      ) : (
        categories.map((cat) => {
          const n = countFor(cat.id)
          return (
            <div key={cat.id} className="flex items-start gap-2 rounded-lg border border-gray-100 p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  <span className="text-xs text-gray-400">
                    {n} producto{n !== 1 ? 's' : ''}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditTarget(cat)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })
      )}
      <Button size="sm" onClick={() => setEditTarget({})} className="mt-1">
        <Plus size={14} /> Nueva categoría
      </Button>
    </div>
  )
}

// ─── Product form ─────────────────────────────────────────────────────────────

function ProductForm({ initial = {}, categories, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name:        initial.name        ?? '',
    description: initial.description ?? '',
    price:       initial.price       ?? '',
    stock:       initial.stock       ?? '',
    min_stock:   initial.min_stock   ?? 0,
    sku:         initial.sku         ?? '',
    unit:        initial.unit        ?? 'pieza',
    category_id: initial.category_id ?? '',
    active:      initial.active      ?? true,
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  const selectedCat = categories.find((c) => c.id === form.category_id)

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre" value={form.name} onChange={set('name')} required />
      <Textarea label="Descripción" value={form.description} onChange={set('description')} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio ($)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
        <Input label="Stock actual" type="number" min="0" value={form.stock} onChange={set('stock')} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Input label="Stock mínimo" type="number" min="0" value={form.min_stock} onChange={set('min_stock')} />
          <p className="text-xs text-gray-400">Muestra alerta cuando el stock llegue a este número.</p>
        </div>
        <Select
          label="Unidad"
          value={form.unit}
          onChange={(v) => setForm((p) => ({ ...p, unit: v }))}
          options={UNITS}
        />
      </div>

      <Input label="Código / SKU" value={form.sku} onChange={set('sku')} placeholder="Opcional" />

      <div className="flex flex-col gap-1">
        <Select
          label="Categoría"
          value={form.category_id}
          onChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
          options={categoryOptions}
          placeholder="Sin categoría"
        />
        {selectedCat?.description && (
          <p className="text-xs text-gray-400">{selectedCat.description}</p>
        )}
      </div>

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
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  const loadCategories = async () => {
    try {
      setCategories(await categoryService.list())
    } catch (err) {
      console.error(err)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [prods] = await Promise.all([
        productService.list(),
        loadCategories(),
      ])
      setProducts(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit   = (p) => { setEditTarget(p);   setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const data = {
        ...form,
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock),
        min_stock:   parseInt(form.min_stock) || 0,
        category_id: form.category_id || null,
        sku:         form.sku || null,
      }
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

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name ?? null

  const filtered = products
    .filter((p) => !filterCategory || p.category_id === filterCategory)
    .filter((p) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
      )
    })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            title="Gestionar categorías"
          >
            <Tags size={18} />
          </button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Nuevo
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre o SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Grid de categorías */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setFilterCategory('')}
            className={`py-3 px-2 rounded-xl text-sm font-medium text-center leading-tight transition-colors ${
              !filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id === filterCategory ? '' : cat.id)}
              className={`py-3 px-2 rounded-xl text-sm font-medium text-center leading-tight transition-colors ${
                filterCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {products.length === 0 ? 'No hay productos' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const lowStock = p.min_stock > 0 && p.stock <= p.min_stock
            return (
              <Card key={p.id}>
                <CardBody className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      {!p.active && <Badge color="gray">Inactivo</Badge>}
                      {lowStock && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                          <AlertTriangle size={10} />
                          Stock bajo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {getCategoryName(p.category_id) ?? 'Sin categoría'}
                      {p.sku ? ` · ${p.sku}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      {' · '}{p.stock} {p.unit ?? 'pieza'}
                      {p.min_stock > 0 ? ` (mín. ${p.min_stock})` : ''}
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
            )
          })}
        </div>
      )}

      {/* Modal producto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar producto' : 'Nuevo producto'}
      >
        <ProductForm
          initial={editTarget ?? {}}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Modal categorías */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Categorías"
      >
        <CategoryManager
          categories={categories}
          products={products}
          onRefresh={loadCategories}
        />
      </Modal>
    </div>
  )
}
