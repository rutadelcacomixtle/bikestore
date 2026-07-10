import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { ChevronDown, Check } from 'lucide-react'

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, value, onChange, options = [], placeholder, disabled, className = '' }) {
  const selected = options.find((o) => String(o.value) === String(value))

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left outline-none transition
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
              disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
              ${error ? 'border-red-400' : 'border-gray-300 bg-white'}`}
          >
            <span className={`flex-1 truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
              {selected?.label ?? placeholder ?? 'Selecciona...'}
            </span>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute top-full left-0 w-full mt-1 rounded-xl border border-gray-200 bg-white shadow-lg outline-none overflow-hidden origin-top transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
          >
            {placeholder && (
              <ListboxOption
                value=""
                className={({ active }) =>
                  `px-3 py-2.5 text-sm cursor-pointer text-gray-400 ${active ? 'bg-gray-50' : ''}`
                }
              >
                {placeholder}
              </ListboxOption>
            )}
            {options.map((opt) => (
              <ListboxOption
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  `flex items-center justify-between gap-2 px-3 py-2.5 text-sm cursor-pointer
                  ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`
                }
              >
                <span className="flex-1">{opt.label}</span>
                {String(opt.value) === String(value) && (
                  <Check size={14} className="text-blue-600 shrink-0" />
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        rows={3}
        className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
