import React, { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

interface PlacaSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inPlant?: boolean
}

const formatPlaca = (text: string, prevText: string): string => {
  let cleaned = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const isDeleting = text.length < prevText.length;

  let letters = '';
  let digits = '';
  const alnum = cleaned.replace(/-/g, '');

  for (let i = 0; i < alnum.length; i++) {
    const ch = alnum[i];
    if (letters.length < 3) {
      if (/[A-Z]/.test(ch)) {
        letters += ch;
      }
    } else if (digits.length < 4) {
      if (/[0-9]/.test(ch)) {
        digits += ch;
      }
    }
  }

  if (letters.length < 3) {
    return letters;
  }

  if (isDeleting) {
    if (digits.length > 0) {
      return `${letters}-${digits}`;
    }
    if (!text.includes('-')) {
      return letters;
    }
    return `${letters}-`;
  } else {
    return `${letters}-${digits}`;
  }
};

export function PlacaSearchInput({
  value,
  onChange,
  placeholder = 'Buscar placa...',
  inPlant = false,
}: PlacaSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
    if (!value) {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [value])

  // Cerrar el menú desplegable al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchVehicles = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/vehicles/search`, {
        params: {
          query: searchQuery,
          inPlant: inPlant ? 'true' : 'false',
          limit: 5,
        },
      })
      const data = response.data?.data || response.data || []
      setSuggestions(data.slice(0, 5))
    } catch (error) {
      console.error('[PlacaSearchInput] Error buscando placas:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlaca(e.target.value, query)
    setQuery(formatted)
    onChange(formatted)

    if (!formatted.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setShowDropdown(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      void searchVehicles(formatted)
    }, 300) // Debounce de 300ms
  }

  const handleSelect = (placa: string) => {
    setQuery(placa)
    onChange(placa)
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="search"
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-brand-orange focus:outline-none"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim()) {
              setShowDropdown(true)
              void searchVehicles(query)
            }
          }}
        />
        {loading && (
          <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-neutral-850 py-1 shadow-2xl custom-scrollbar" style={{ backgroundColor: '#212121' }}>
          {suggestions.slice(0, 5).map((item) => (
            <li
              key={item.id || item.placa}
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors"
              onClick={() => handleSelect(item.placa)}
            >
              <div>
                <span className="font-bold text-gray-100">{item.placa}</span>
                <span className="ml-2 text-xs text-gray-400">{item.cliente}</span>
              </div>
              <span
                className={`rounded border px-2 py-0.5 text-xs ${
                  item.estado?.codigo === 'EN_PLANTA'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                {item.estado?.codigo === 'EN_PLANTA' ? 'EN PLANTA' : 'HISTÓRICO'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
