import { useEffect, useState } from 'react'
import { Plus, ShoppingCart, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { salesService, productService, profileService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const PAYMENT_OPTIONS = [
  { value: 'cash',     label: 'Efectivo'       },
  { value: 'transfer', label: 'Transferencia'  },
  { value: 'card',     label: 'Tarjeta'        },
]
const PAYMENT_LABEL = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }
const PAYMENT_COLOR = { cash: 'green',    transfer: 'blue',          card: 'yellow'  }

// ─── Modal: nueva venta ───────────────────────────────────────────────────────

function QuickSaleModal({ products, customers, onSave, onCancel, loading }) {
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')

  const results = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : []

  const addToCart = (product) => {
    setCart((prev) => {
      const hit = prev.find((i) => i.product.id === product.id)
      if (hit) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
    setSearch('')
    setShowResults(false)
  }

  const setQty = (id, raw) => {
    const n = Math.max(1, parseInt(raw) || 1)
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: n } : i))
  }

  const remove = (id) => setCart((prev) => prev.filter((i) => i.product.id !== id))

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.full_name }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!cart.length) return
    onSave({
      sale: {
        customer_id:    customerId || null,
        payment_method: paymentMethod,
        total,
        notes:          notes || null,
      },
      items: cart.map((i) => ({
        product_id:   i.product.id,
        product_name: i.product.name,
        quantity:     i.quantity,
        unit_price:   i.product.price,
        subtotal:     i.product.price * i.quantity,
      })),
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

      {/* Buscador de productos */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Agregar producto</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {showResults && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  <span className="text-gray-400 shrink-0 ml-2">
                    ${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrito */}
      {cart.length > 0 && (
        <div className="flex flex-col gap-2">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400">
                  ${item.product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} / {item.product.unit ?? 'pieza'}
                </p>
              </div>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => setQty(item.product.id, e.target.value)}
                className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center outline-none focus:border-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800 w-16 text-right shrink-0">
                ${(item.product.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={() => remove(item.product.id)}
                className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between px-1 pt-1 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-bold text-gray-900">
              ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Pago y cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Método de pago"
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_OPTIONS}
        />
        <Select
          label="Cliente"
          value={customerId}
          onChange={setCustomerId}
          options={customerOptions}
          placeholder="Sin registrar"
        />
      </div>

      <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Opcional" />

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={cart.length === 0} className="flex-1">
          Cobrar ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </Button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Sales() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p, c] = await Promise.all([
        salesService.list(),
        productService.list(true),
        profileService.list(),
      ])
      setSales(s)
      setProducts(p)
      setCustomers(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async ({ sale, items }) => {
    setSaving(true)
    try {
      await salesService.create(sale, items)
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Ventas</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nueva venta
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sales.map((sale) => {
            const expanded = expandedId === sale.id
            const customer = customers.find((c) => c.id === sale.customer_id)
            const itemCount = sale.sale_items?.length ?? 0
            return (
              <Card key={sale.id}>
                <CardBody className="flex flex-col">
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full text-left"
                    onClick={() => toggle(sale.id)}
                  >
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                      <ShoppingCart size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">
                          ${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge color={PAYMENT_COLOR[sale.payment_method] ?? 'gray'}>
                          {PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {customer?.full_name ?? 'Cliente no registrado'}
                        {' · '}
                        {itemCount} producto{itemCount !== 1 ? 's' : ''}
                        {' · '}
                        {new Date(sale.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    {expanded
                      ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                      : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                    }
                  </button>

                  {expanded && itemCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
                      {sale.sale_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate flex-1">{item.product_name}</span>
                          <span className="text-gray-500 shrink-0 ml-3">
                            {item.quantity} × ${item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            {' = '}
                            <span className="font-medium text-gray-800">
                              ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </span>
                        </div>
                      ))}
                      {sale.notes && (
                        <p className="text-xs text-gray-400 italic mt-1">{sale.notes}</p>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva venta">
        <QuickSaleModal
          products={products}
          customers={customers}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
