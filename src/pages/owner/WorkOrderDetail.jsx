import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, FileText, CreditCard } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import {
  workOrderService,
  workOrderProductService,
  productService,
  profileService,
  bicycleService,
} from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { ReceiptPDF } from '@/components/pdf/ReceiptPDF'

const STATUS_FLOW = ['received', 'in_progress', 'ready', 'delivered']
const STATUS_LABELS = {
  received: 'Recibida',
  in_progress: 'En proceso',
  ready: 'Lista',
  delivered: 'Entregada',
}
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
]

export default function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [orderProducts, setOrderProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [bicycle, setBicycle] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addProductModal, setAddProductModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState('cash')
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    try {
      const o = await workOrderService.get(id)
      setOrder(o)
      setEditForm({
        description: o.description,
        diagnosis: o.diagnosis ?? '',
        labor_cost: o.labor_cost ?? 0,
        status: o.status,
      })
      const [ops, p, bikes, prods] = await Promise.all([
        workOrderProductService.listByOrder(id),
        profileService.get(o.customer_id),
        bicycleService.listByCustomer(o.customer_id),
        productService.list(true),
      ])
      setOrderProducts(ops)
      setProfile(p)
      setBicycle(bikes.find((b) => b.id === o.bicycle_id) ?? null)
      setProducts(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const nextStatus = () => {
    const idx = STATUS_FLOW.indexOf(order?.status)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  const handleAdvanceStatus = async () => {
    const next = nextStatus()
    if (!next) return
    setSaving(true)
    try {
      await workOrderService.update(id, { status: next })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    const prod = products.find((p) => p.id === selectedProduct)
    if (!prod) return
    setSaving(true)
    try {
      await workOrderProductService.add({
        work_order_id: id,
        product_id: prod.id,
        product_name: prod.name,
        quantity: parseInt(qty),
        unit_price: prod.price,
        subtotal: prod.price * parseInt(qty),
      })
      setAddProductModal(false)
      setSelectedProduct('')
      setQty(1)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveProduct = async (productId) => {
    if (!confirm('¿Quitar este producto?')) return
    try {
      await workOrderProductService.remove(productId)
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePay = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await workOrderService.markPaid(id, payMethod)
      setPayModal(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await workOrderService.update(id, {
        ...editForm,
        labor_cost: parseFloat(editForm.labor_cost) || 0,
      })
      setEditModal(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const total = (order?.labor_cost ?? 0) +
    orderProducts.reduce((s, p) => s + p.subtotal, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{order.description}</h1>
          <StatusBadge status={order.status} />
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditModal(true)}>
          Editar
        </Button>
      </div>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Cliente</p>
            <p className="font-medium text-gray-800">{profile?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Bicicleta</p>
            <p className="font-medium text-gray-800">
              {bicycle ? `${bicycle.brand} ${bicycle.model}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Creada</p>
            <p className="font-medium text-gray-800">
              {new Date(order.created_at).toLocaleDateString('es-MX')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Mano de obra</p>
            <p className="font-medium text-gray-800">
              ${(order.labor_cost ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {order.diagnosis && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Diagnóstico</p>
              <p className="text-gray-700">{order.diagnosis}</p>
            </div>
          )}
          {order.paid_at && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Pagado</p>
              <p className="text-gray-700">
                {new Date(order.paid_at).toLocaleDateString('es-MX')} —{' '}
                {PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.label}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Products */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">Productos / Refacciones</h2>
          <Button size="sm" onClick={() => setAddProductModal(true)}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
        {orderProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin productos agregados</p>
        ) : (
          <div className="flex flex-col gap-1">
            {orderProducts.map((op) => (
              <Card key={op.id}>
                <CardBody className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{op.product_name}</p>
                    <p className="text-xs text-gray-400">
                      {op.quantity} × ${op.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${op.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => handleRemoveProduct(op.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-between items-center py-3 border-t border-gray-200 mb-6">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-xl font-bold text-gray-900">
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {nextStatus() && (
          <Button onClick={handleAdvanceStatus} loading={saving} className="w-full">
            Marcar como: {STATUS_LABELS[nextStatus()]}
          </Button>
        )}
        {order.status === 'ready' && !order.paid_at && (
          <Button variant="secondary" onClick={() => setPayModal(true)} className="w-full">
            <CreditCard size={16} /> Registrar pago
          </Button>
        )}
        <PDFDownloadLink
          document={<ReceiptPDF order={order} profile={profile} bicycle={bicycle} orderProducts={orderProducts} total={total} />}
          fileName={`recibo-${id.slice(0, 8)}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <Button variant="ghost" disabled={pdfLoading} className="w-full">
              <FileText size={16} />
              {pdfLoading ? 'Generando PDF...' : 'Descargar recibo PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Add Product Modal */}
      <Modal open={addProductModal} onClose={() => setAddProductModal(false)} title="Agregar producto">
        <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
          <Select
            label="Producto"
            value={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="Selecciona un producto"
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} — $${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            }))}
          />
          <Input
            label="Cantidad"
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddProductModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Agregar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Registrar pago">
        <form onSubmit={handlePay} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Total a cobrar:{' '}
            <span className="font-bold text-gray-900">
              ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <Select
            label="Método de pago"
            value={payMethod}
            onChange={setPayMethod}
            options={PAYMENT_METHODS}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPayModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Confirmar pago
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar orden">
        <form onSubmit={handleEdit} className="flex flex-col gap-3">
          <Textarea
            label="Descripción"
            value={editForm.description ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
          <Textarea
            label="Diagnóstico"
            value={editForm.diagnosis ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, diagnosis: e.target.value }))}
          />
          <Input
            label="Mano de obra ($)"
            type="number"
            min="0"
            step="0.01"
            value={editForm.labor_cost ?? 0}
            onChange={(e) => setEditForm((f) => ({ ...f, labor_cost: e.target.value }))}
          />
          <Select
            label="Estado"
            value={editForm.status ?? ''}
            onChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
            options={STATUS_FLOW.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditModal(false)} className="flex-1">
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
