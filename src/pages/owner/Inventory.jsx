import { useEffect, useState } from 'react'
import { Plus, Package, Search, X, Truck } from 'lucide-react'
import { stockEntryService, supplierService, productService, categoryService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

const PERIODS = [
  { label: 'Este mes',     value: 'this_month' },
  { label: 'Mes anterior', value: 'last_month' },
  { label: 'Este año',     value: 'this_year'  },
]

function getPeriodRange(period) {
  const now = new Date()
  if (period === 'this_month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    }
  }
  if (period === 'last_month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      to:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
    }
  }
  return {
    from: new Date(now.getFullYear(), 0, 1).toISOString(),
    to:   new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
  }
}

const fmt = (n) =>
  `$${(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Formulario inline: nuevo proveedor ──────────────────────────────────────

function NewSupplierForm({ onSave, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-blue-700">Nuevo proveedor</p>
      <Input label="Nombre" value={form.name} onChange={set('name')} required autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="Opcional" />
        <Input label="Email"    value={form.email} onChange={set('email')} placeholder="Opcional" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button
          type="button"
          size="sm"
          loading={loading}
          disabled={!form.name.trim()}
          onClick={() => onSave(form)}
          className="flex-1"
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ─── Formulario inline: nuevo producto ───────────────────────────────────────

function NewProductForm({ initialName = '', categories, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name:       initialName,
    price:      '',
    cost_price: '',
    unit:       'pieza',
    category_id: '',
    active:     true,
    stock:      0,
    min_stock:  0,
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-green-700">Nuevo producto</p>
      <Input label="Nombre" value={form.name} onChange={set('name')} required autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Precio venta ($)"  type="number" min="0" step="0.01" value={form.price}      onChange={set('price')}      required />
        <Input label="Precio costo ($)"  type="number" min="0" step="0.01" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" />
      </div>
      {catOptions.length > 0 && (
        <Select
          label="Categoría"
          value={form.category_id}
          onChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
          options={catOptions}
          placeholder="Sin categoría"
        />
      )}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button
          type="button"
          size="sm"
          loading={loading}
          disabled={!form.name.trim() || !form.price}
          onClick={() => onSave(form)}
          className="flex-1"
        >
          Crear
        </Button>
      </div>
    </div>
  )
}

// ─── Modal: registrar compra ──────────────────────────────────────────────────

function PurchaseModal({ suppliers, products, categories, onSave, onCancel, loading }) {
  const [cart, setCart]               = useState([])
  const [search, setSearch]           = useState('')
  const [showResults, setShowResults] = useState(false)
  const [supplierId, setSupplierId]   = useState('')
  const [notes, setNotes]             = useState('')

  const [newSupplierMode,  setNewSupplierMode]  = useState(false)
  const [savingSupplier,   setSavingSupplier]   = useState(false)
  const [newProductMode,   setNewProductMode]   = useState(false)
  const [newProductSearch, setNewProductSearch] = useState('')
  const [savingProduct,    setSavingProduct]    = useState(false)
  const [localSuppliers,   setLocalSuppliers]   = useState(suppliers)
  const [localProducts,    setLocalProducts]    = useState(products)

  const results = search.trim()
    ? localProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : []

  const addToCart = (product) => {
    setCart((prev) => {
      const hit = prev.find((i) => i.product.id === product.id)
      if (hit) return prev.map((i) =>
        i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
      )
      return [
        ...prev,
        { product, qty: 1, unit_cost: product.cost_price > 0 ? String(product.cost_price) : '' },
      ]
    })
    setSearch('')
    setShowResults(false)
  }

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.product.id !== id))
  const setQty  = (id, val) => setCart((prev) => prev.map((i) =>
    i.product.id === id ? { ...i, qty: Math.max(1, parseInt(val) || 1) } : i
  ))
  const setCost = (id, val) => setCart((prev) => prev.map((i) =>
    i.product.id === id ? { ...i, unit_cost: val } : i
  ))

  const total = cart.reduce(
    (s, i) => s + (parseInt(i.qty) || 0) * (parseFloat(i.unit_cost) || 0),
    0
  )

  const handleCreateSupplier = async (form) => {
    setSavingSupplier(true)
    try {
      const sup = await supplierService.create({ name: form.name, phone: form.phone || null, email: form.email || null })
      setLocalSuppliers((prev) => [...prev, sup].sort((a, b) => a.name.localeCompare(b.name)))
      setSupplierId(sup.id)
      setNewSupplierMode(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSupplier(false)
    }
  }

  const handleCreateProduct = async (form) => {
    setSavingProduct(true)
    try {
      const prod = await productService.create({
        name:        form.name,
        price:       parseFloat(form.price),
        cost_price:  parseFloat(form.cost_price) || 0,
        unit:        form.unit,
        category_id: form.category_id || null,
        active:      true,
        stock:       0,
        min_stock:   0,
      })
      setLocalProducts((prev) => [...prev, prod].sort((a, b) => a.name.localeCompare(b.name)))
      addToCart(prod)
      setNewProductMode(false)
      setNewProductSearch('')
    } catch (err) {
      console.error(err)
    } finally {
      setSavingProduct(false)
    }
  }

  const selectedSupplier = localSuppliers.find((s) => s.id === supplierId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!cart.length) return
    onSave({
      supplier_id:   supplierId      || null,
      supplier_name: selectedSupplier?.name || null,
      notes,
      items: cart.map((i) => ({
        product_id:   i.product.id,
        product_name: i.product.name,
        quantity:     parseInt(i.qty),
        unit_cost:    parseFloat(i.unit_cost) || 0,
      })),
    })
  }

  const supplierOptions = localSuppliers.map((s) => ({ value: s.id, label: s.name }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Proveedor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Proveedor</label>
          {!newSupplierMode && (
            <button
              type="button"
              onClick={() => setNewSupplierMode(true)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <Plus size={11} /> Nuevo
            </button>
          )}
        </div>
        {newSupplierMode ? (
          <NewSupplierForm
            onSave={handleCreateSupplier}
            onCancel={() => setNewSupplierMode(false)}
            loading={savingSupplier}
          />
        ) : (
          <Select
            value={supplierId}
            onChange={setSupplierId}
            options={supplierOptions}
            placeholder="Sin proveedor"
          />
        )}
      </div>

      {/* Buscador de productos */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Agregar producto</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {showResults && search.trim() && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  {p.cost_price > 0 && (
                    <span className="text-gray-400 shrink-0 ml-2">
                      costo {fmt(p.cost_price)}
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onMouseDown={() => { setNewProductSearch(search.trim()); setNewProductMode(true) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 border-t border-gray-100"
              >
                <Plus size={13} />
                {results.length === 0 ? `Crear "${search.trim()}"` : 'Producto nuevo…'}
              </button>
            </div>
          )}
        </div>

        {newProductMode && (
          <div className="mt-2">
            <NewProductForm
              initialName={newProductSearch}
              categories={categories}
              onSave={handleCreateProduct}
              onCancel={() => { setNewProductMode(false); setNewProductSearch('') }}
              loading={savingProduct}
            />
          </div>
        )}
      </div>

      {/* Carrito de productos */}
      {cart.length > 0 && (
        <div className="flex flex-col gap-2">
          {cart.map((item) => (
            <div key={item.product.id} className="rounded-lg bg-gray-50 px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-500">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => setQty(item.product.id, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-500">Costo unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) => setCost(item.product.id, e.target.value)}
                    placeholder="0.00"
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              {item.qty && item.unit_cost && !isNaN(parseFloat(item.unit_cost)) && (
                <p className="text-xs text-gray-500 text-right">
                  Subtotal: <span className="font-semibold text-gray-700">
                    {fmt(parseInt(item.qty) * parseFloat(item.unit_cost))}
                  </span>
                </p>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between px-1 pt-1 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total compra</span>
            <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
          </div>
        </div>
      )}

      <Textarea
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Factura, número de lote, etc."
      />

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={cart.length === 0} className="flex-1">
          Guardar compra
        </Button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Inventory() {
  const [period, setPeriod]     = useState('this_month')
  const [entries, setEntries]   = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [stockValue, setStockValue] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)

  const { from, to } = getPeriodRange(period)

  const load = async () => {
    setLoading(true)
    try {
      const [ents, prods, cats, sups] = await Promise.all([
        stockEntryService.list(from, to),
        productService.list(),
        categoryService.list(),
        supplierService.list(),
      ])
      setEntries(ents)
      setProducts(prods)
      setCategories(cats)
      setSuppliers(sups)
      // Valor del inventario a precio de costo
      const { data: stockData } = await supabase
        .from('products')
        .select('stock, cost_price')
        .eq('active', true)
      if (stockData) {
        setStockValue(stockData.reduce((s, p) => s + (p.stock ?? 0) * (p.cost_price ?? 0), 0))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period])

  const totalPurchases = entries.reduce((s, e) => s + (e.total_cost ?? 0), 0)

  const handleSave = async ({ supplier_id, supplier_name, notes, items }) => {
    setSaving(true)
    try {
      await stockEntryService.createBatch({ supplier_id, supplier_name, notes }, items)
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Package size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
      </div>

      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        </div>
      ) : (
        <>
          {/* Resumen */}
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Resumen del período
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Compras en el período</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(totalPurchases)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entries.length} entrada{entries.length !== 1 ? 's' : ''}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Valor de inventario</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stockValue !== null ? fmt(stockValue) : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">a precio de costo</p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Lista de entradas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Entradas de inventario
              </p>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus size={14} /> Registrar compra
              </Button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin entradas en este período</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((e) => (
                  <Card key={e.id} onClick={() => setDetailTarget(e)}>
                    <CardBody className="flex items-center gap-3 py-2.5">
                      <div className="bg-green-50 text-green-700 rounded-xl p-2 shrink-0">
                        <Package size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.product_name}</p>
                        <p className="text-xs text-gray-400">
                          {e.quantity} × {fmt(e.unit_cost)}
                          {e.supplier ? ` · ${e.supplier}` : ''}
                        </p>
                        {e.notes && (
                          <p className="text-xs text-gray-400 truncate italic">{e.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{fmt(e.total_cost)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(e.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short',
                          })}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar compra">
        <PurchaseModal
          suppliers={suppliers}
          products={products}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Detalle de entrada">
        {detailTarget && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 text-green-700 rounded-xl p-2.5 shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{detailTarget.product_name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(detailTarget.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400 mb-0.5">Cantidad</p>
                <p className="font-semibold text-gray-900">{detailTarget.quantity}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400 mb-0.5">Costo unitario</p>
                <p className="font-semibold text-gray-900">{fmt(detailTarget.unit_cost)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400 mb-0.5">Total</p>
                <p className="font-semibold text-gray-900">{fmt(detailTarget.total_cost)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400 mb-0.5">Proveedor</p>
                <p className="font-semibold text-gray-900 truncate">{detailTarget.supplier || '—'}</p>
              </div>
            </div>

            {detailTarget.notes && (
              <div className="text-sm">
                <p className="text-xs text-gray-400 mb-0.5">Notas</p>
                <p className="text-gray-700 italic">{detailTarget.notes}</p>
              </div>
            )}

            <Button variant="secondary" onClick={() => setDetailTarget(null)} className="w-full mt-1">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
