import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Pagination } from '../Pagination'
import { DateRange } from '../DateRange'
import { auditActionLabel } from './auditActionLabels'

type AuditLogRow = {
  id: string
  entityType: string
  entityId: string | null
  action: string
  syncStatus: 'SYNCED' | 'ERROR'
  errorMessage: string | null
  clientCreatedAt: string | null
  createdAt: string
  user: { fullName: string; username: string } | null
  device: { nombre: string; registrado: boolean } | null
}

const PAGE_SIZE = 20

const ENTITY_TYPES = [
  { value: '', label: 'Todas las entidades' },
  { value: 'VEHICLE', label: 'Vehículo' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'PALLET_RECEPCION', label: 'Recepción de pallet' },
]

const OPERATIONS = [
  { value: '', label: 'Todas las operaciones' },
  { value: 'VEHICLE_INGRESO', label: 'Registrar ingreso' },
  { value: 'VEHICLE_SALIDA', label: 'Registrar salida' },
  { value: 'VEHICLE_ACTUALIZACION', label: 'Corrección de vehículo' },
  { value: 'PALLET_PESAJE', label: 'Pesaje de pallet' },
  { value: 'PALLET_DESCARGA', label: 'Despacho (descarga)' },
  { value: 'PALLET_REPESAJE', label: 'Repesaje' },
  { value: 'PALLET_CAMBIO_INGRESO', label: 'Cambio de ingreso' },
  { value: 'PALLET_ACTUALIZACION', label: 'Corrección de pallet' },
  { value: 'PALLET_RECEPCION', label: 'Recepción en producción' },
]

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogTable() {
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [syncStatus, setSyncStatus] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/auditoria/logs', {
        params: {
          entityType: entityType || undefined,
          action: action || undefined,
          syncStatus: syncStatus || undefined,
          from: range.from || undefined,
          to: range.to || undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        },
      })
      // El backend envuelve toda respuesta en { data: ... } (TransformInterceptor),
      // y findLogs ya devuelve { data, total, limit, offset } -> doble anidado
      setRows(res.data?.data?.data ?? [])
      setTotal(res.data?.data?.total ?? 0)
    } catch {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [entityType, action, syncStatus, range, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm mb-1">Entidad</label>
          <select
            className="select"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value)
              setPage(1)
            }}
          >
            {ENTITY_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Operación</label>
          <select
            className="select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
          >
            {OPERATIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Estado</label>
          <select
            className="select"
            value={syncStatus}
            onChange={(e) => {
              setSyncStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos</option>
            <option value="SYNCED">Sincronizado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        <DateRange
          from={range.from}
          to={range.to}
          onChange={(next) => {
            setRange(next)
            setPage(1)
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha servidor</th>
              <th>Fecha en PDA</th>
              <th>Entidad</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>Dispositivo</th>
              <th>Estado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/60">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/60">
                  No hay registros de auditoría con estos filtros.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{formatDate(row.clientCreatedAt)}</td>
                  <td>{row.entityType}</td>
                  <td className="font-medium">{auditActionLabel(row.action)}</td>
                  <td>{row.user?.fullName ?? '-'}</td>
                  <td>
                    {row.device
                      ? `${row.device.nombre}${row.device.registrado ? '' : ' (no registrado)'}`
                      : '-'}
                  </td>
                  <td>
                    <span
                      className={
                        row.syncStatus === 'SYNCED'
                          ? 'px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                      }
                    >
                      {row.syncStatus === 'SYNCED' ? 'Sincronizado' : 'Error'}
                    </span>
                  </td>
                  <td className="text-white/60 text-xs max-w-xs truncate">
                    {row.errorMessage ?? '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </section>
  )
}
