export function Card({ children, className = '', onClick }) {
  const base = 'bg-white rounded-xl border border-gray-100 shadow-sm'
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} w-full text-left active:scale-[0.98] transition-transform ${className}`}
      >
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
