import { useEffect, useState } from 'react'
import { Plus, Package, TrendingUp } from 'lucide-react'
import { financeService, stockEntryService, productService } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'

const PERIODS = [
  { label: 'Este mes',    value: 'this_month'  },
  { label: 'Mes anterior', value: 'last_month' },
  { label: 'Este año',    value: 'this_year'   },
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

export default function Finance() {
  const [period, setPeriod] = useState('this_month')
  const [summary, setSummary] = useState(null)
  const [entries, setEntries] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [entryModal, setEntryModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity: '1', unit_cost: '', supplier: '', notes: '' })

  const { from, to } = getPeriodRange(period)

  const load = async () => {
    setLoading(true)
    try {
      const [sum, ents, prods] = await Promise.all([
        financeService.getSummary(from, to),
        stockEntryService.list(from, to),
        productService.list(),
      ])
      setSummary(sum)
      setEntries(ents)
      setProducts(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period])

  const handleProductChange = (productId) => {
    const prod = products.find((p) => p.id === productId)
    setForm((f) => ({
      ...f,
      product_id: productId,
      unit_cost: prod?.cost_price > 0 ? String(prod.cost_price) : f.unit_cost,
    }))
  }

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    const qty      = parseInt(form.quantity)
    const unitCost = parseFloat(form.unit_cost)
    if (!form.product_id || !qty || isNaN(unitCost)) return
    const prod = products.find((p) => p.id === form.product_id)
    setSaving(true)
    try {
      await stockEntryService.create({
        product_id:   form.product_id,
        product_name: prod.name,
        quantity:     qty,
        unit_cost:    unitCost,
        total_cost:   qty * unitCost,
        supplier:     form.supplier || null,
        notes:        form.notes    || null,
      })
      setEntryModal(false)
      setForm({ product_id: '', quantity: '1', unit_cost: '', supplier: '', notes: '' })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const totalEntryPreview =
    form.quantity && form.unit_cost
      ? parseInt(form.quantity) * parseFloat(form.unit_cost)
      : null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-blue-700" />
        <h1 className="text-xl font-bold text-gray-900">Finanzas</h1>
      </div>

      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : summary && (
        <>
          {/* Resumen del período */}
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Resumen del período · {summary.orderCount} orden{summary.orderCount !== 1 ? 'es' : ''} pagada{summary.orderCount !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Ingresos totales</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(summary.revenue)}</p>
                  <div className="text-xs text-gray-400 mt-1 flex flex-col gap-0.5">
                    <span>Mano de obra: {fmt(summary.laborRevenue)}</span>
                    <span>Productos: {fmt(summary.productRevenue)}</span>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Costo de productos</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(summary.cogs)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {summary.cogs > 0
                      ? `${Math.round((summary.cogs / summary.revenue) * 100)}% de ingresos`
                      : 'Sin datos de costo'}
                  </p>
                </CardBody>
              </Card>
            </div>

            <Card className={summary.grossProfit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardBody className="flex items-center justify-between py-3">
                <div>
                  <p className={`text-xs font-semibold mb-0.5 ${summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Ganancia bruta
                  </p>
                  <p className={`text-xs ${summary.grossProfit >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    Ingresos − costo de productos
                  </p>
                </div>
                <p className={`text-2xl font-bold ${summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmt(summary.grossProfit)}
                </p>
              </CardBody>
            </Card>
          </section>

          {/* Inventario */}
          <section className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inventario</p>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Compras en el período</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(summary.purchasesCost)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {summary.entryCount} entrada{summary.entryCount !== 1 ? 's' : ''}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Valor de inventario</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(summary.stockValue)}</p>
                  <p className="text-xs text-gray-400 mt-1">a precio de costo</p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Entradas de inventario */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Entradas de inventario
              </p>
              <Button size="sm" onClick={() => setEntryModal(true)}>
                <Plus size={14} /> Registrar compra
              </Button>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin entradas en este período</p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((e) => (
                  <Card key={e.id}>
                    <CardBody className="flex items-center gap-3 py-2.5">
                      <div className="bg-blue-50 text-blue-700 rounded-xl p-2 shrink-0">
                        <Package size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.product_name}</p>
                        <p className="text-xs text-gray-400">
                          {e.quantity} × {fmt(e.unit_cost)}
                          {e.supplier ? ` · ${e.supplier}` : ''}
                        </p>
                        {e.notes && <p className="text-xs text-gray-400 truncate italic">{e.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{fmt(e.total_cost)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(e.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
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

      {/* Modal: nueva entrada de inventario */}
      <Modal open={entryModal} onClose={() => setEntryModal(false)} title="Registrar compra">
        <form onSubmit={handleCreateEntry} className="flex flex-col gap-3">
          <Select
            label="Producto"
            value={form.product_id}
            onChange={handleProductChange}
            placeholder="Selecciona un producto"
            options={products.map((p) => ({ value: p.id, label: p.name }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Cantidad"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
            <Input
              label="Costo unitario ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.unit_cost}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
              required
            />
          </div>

          {totalEntryPreview !== null && !isNaN(totalEntryPreview) && (
            <p className="text-sm text-gray-600 -mt-1">
              Total: <span className="font-semibold text-gray-900">{fmt(totalEntryPreview)}</span>
            </p>
          )}

          <Input
            label="Proveedor (opcional)"
            value={form.supplier}
            onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
          <Input
            label="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEntryModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
