const statusMap = {
  received:    { label: 'Recibida',    cls: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En proceso',  cls: 'bg-yellow-100 text-yellow-800' },
  ready:       { label: 'Lista',        cls: 'bg-green-100 text-green-800' },
  delivered:   { label: 'Entregada',   cls: 'bg-blue-100 text-blue-800' },
}

export function StatusBadge({ status, paidAt }) {
  const def = statusMap[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' }

  if (status === 'delivered') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paidAt ? def.cls : 'bg-orange-100 text-orange-800'}`}>
        {def.label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${def.cls}`}>
        {def.label}
      </span>
      {paidAt && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Pagado
        </span>
      )}
    </span>
  )
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-100 text-gray-700',
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red:    'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}
