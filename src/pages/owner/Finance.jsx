import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { financeService } from '@/lib/supabase'
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
  const [loading, setLoading] = useState(true)

  const { from, to } = getPeriodRange(period)

  const load = async () => {
    setLoading(true)
    try {
      setSummary(await financeService.getSummary(from, to))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period])

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

        </>
      )}
    </div>
  )
}
