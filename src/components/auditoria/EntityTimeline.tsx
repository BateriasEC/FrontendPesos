import { useState } from 'react'
import { api } from '../../services/api'
import { auditActionLabel } from './auditActionLabels'

type TimelineEntry = {
  id: string
  action: string
  syncStatus: 'SYNCED' | 'ERROR'
  errorMessage: string | null
  previousData: unknown
  newData: unknown
  clientCreatedAt: string | null
  createdAt: string
  user: { fullName: string; username: string } | null
  device: { nombre: string; registrado: boolean } | null
}

const ENTITY_TYPES = [
  { value: 'VEHICLE', label: 'Vehículo' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'PALLET_RECEPCION', label: 'Recepción de pallet' },
]

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function EntityTimeline() {
  const [entityType, setEntityType] = useState('VEHICLE')
  const [entityId, setEntityId] = useState('')
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!entityId.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/auditoria/timeline/${entityType}/${entityId.trim()}`)
      // El backend envuelve toda respuesta en { data: ... } (TransformInterceptor)
      setEntries(res.data?.data ?? [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm mb-1">Tipo de entidad</label>
          <select className="select" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {ENTITY_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm mb-1">ID (UUID del backend)</label>
          <input
            className="input"
            placeholder="Pegue el ID de la entidad"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>

        <button className="btn btn-primary" onClick={search} disabled={loading}>
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-white/60">Cargando línea de tiempo...</div>
      ) : !searched ? (
        <div className="p-6 text-center text-white/60">
          Ingrese el ID de un vehículo o pallet para ver su historial completo.
        </div>
      ) : entries.length === 0 ? (
        <div className="p-6 text-center text-white/60">
          No se encontraron registros de auditoría para este ID.
        </div>
      ) : (
        <ol className="space-y-3 border-l border-white/10 pl-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-brand-orange" />
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{auditActionLabel(entry.action)}</span>
                  <span
                    className={
                      entry.syncStatus === 'SYNCED'
                        ? 'px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                    }
                  >
                    {entry.syncStatus === 'SYNCED' ? 'Sincronizado' : 'Error'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/60 space-x-3">
                  <span>Creado en PDA: {formatDate(entry.clientCreatedAt)}</span>
                  <span>Llegó al servidor: {formatDate(entry.createdAt)}</span>
                  <span>Usuario: {entry.user?.fullName ?? '-'}</span>
                  <span>Dispositivo: {entry.device?.nombre ?? '-'}</span>
                </div>
                {entry.errorMessage ? (
                  <p className="mt-1 text-xs text-red-400">{entry.errorMessage}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
