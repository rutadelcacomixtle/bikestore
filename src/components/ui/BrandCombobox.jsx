import { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

export default function BrandCombobox({
  label, value, onChange, options = [],
  placeholder = 'Selecciona o escribe...', error, required, autoFocus,
}) {
  const [query, setQuery] = useState('')

  const filtered = query === ''
    ? options
    : options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <Combobox
        value={value}
        onChange={(val) => { onChange(val ?? ''); setQuery('') }}
      >
        <div className="relative">
          <ComboboxInput
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
              error ? 'border-red-400' : 'border-gray-300'
            }`}
            displayValue={(val) => val || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown size={14} className="text-gray-400" />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor="bottom"
          transition
          className="w-[var(--button-width)] [--anchor-gap:4px] rounded-xl border border-gray-200 bg-white shadow-lg outline-none overflow-hidden origin-top transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
        >
          {filtered.length === 0 && query !== '' ? (
            <ComboboxOption
              value={query}
              className="px-3 py-2.5 text-sm text-gray-400 cursor-pointer data-[active]:bg-blue-50 data-[active]:text-gray-700"
            >
              Usar &quot;{query}&quot;
            </ComboboxOption>
          ) : (
            filtered.map((opt) => (
              <ComboboxOption
                key={opt}
                value={opt}
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm cursor-pointer data-[active]:bg-blue-50 data-[active]:text-blue-700 text-gray-700"
              >
                {opt}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
