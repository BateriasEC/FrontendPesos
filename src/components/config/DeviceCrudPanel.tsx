import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { Modal } from '../Modal'
import { Pagination } from '../Pagination'
import type { DispositivoConfig, RolBalanza, TipoDispositivo } from '../../types/dispositivos'
import { ROL_BALANZA_LABELS } from '../../types/dispositivos'
import {
  loadConnectionMap,
  removeConnectionEntry,
  saveConnectionMap,
  type StoredConnectionEntry,
} from '../../lib/deviceConnectionStorage'

type DeviceForm = {
  nombre: string
  ip: string
  puerto: string
  habilitado: boolean
  rolBalanza: RolBalanza
  identificador: string
  descripcion: string
}

const defaultForm = (tipo: TipoDispositivo): DeviceForm => ({
  nombre: '',
  ip: '',
  puerto: tipo === 'IMPRESORA' ? '9100' : tipo === 'BALANZA' ? '5000' : '',
  habilitado: true,
  rolBalanza: 'INGRESO_SALIDA',
  identificador: '',
  descripcion: '',
})

type ConnectionState = 'idle' | 'testing' | 'ok' | 'error'

const CONNECTION_LABELS: Record<ConnectionState, { text: string; className: string }> = {
  idle: { text: 'Sin verificar', className: 'text-white/50' },
  testing: { text: 'Probando...', className: 'text-yellow-300' },
  ok: { text: 'Conectado', className: 'text-green-400' },
  error: { text: 'Sin conexión', className: 'text-red-300' },
}

const DISABLED_CONNECTION = { text: 'Deshabilitado', className: 'text-white/40' }

function getConnectionDisplay(
  row: DispositivoConfig,
  connectionMap: Record<string, StoredConnectionEntry>,
  testingId: string | null,
) {
  if (!row.habilitado) {
    return { ...DISABLED_CONNECTION, message: undefined as string | undefined }
  }
  if (testingId === row.id) {
    return { ...CONNECTION_LABELS.testing, message: undefined as string | undefined }
  }
  const stored = connectionMap[row.id]
  const state = stored?.state || 'idle'
  return {
    ...CONNECTION_LABELS[state],
    message: state === 'error' ? stored?.message : undefined,
  }
}

type Props = {
  tipo: TipoDispositivo
  title: string
  description: string
}

export function DeviceCrudPanel({ tipo, title, description }: Props) {
  const [rows, setRows] = useState<DispositivoConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<DispositivoConfig | null>(null)
  const [form, setForm] = useState<DeviceForm>(() => defaultForm(tipo))
  const [testingId, setTestingId] = useState<string | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)
  const [connectionMap, setConnectionMap] = useState<Record<string, StoredConnectionEntry>>(() =>
    loadConnectionMap(),
  )
  const [printResult, setPrintResult] = useState<{
    deviceName: string
    success: boolean
    message: string
    detalle?: Record<string, unknown>
  } | null>(null)
  const pageSize = 8

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/configuracion-dispositivos/dispositivos', {
        params: { tipo },
      })
      const items = response.data?.data || response.data || []
      setRows(Array.isArray(items) ? items : [])
    } catch (error) {
      console.error(`Error cargando ${tipo}:`, error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tipo])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const syncFromStorage = () => setConnectionMap(loadConnectionMap())
    window.addEventListener('focus', syncFromStorage)
    return () => window.removeEventListener('focus', syncFromStorage)
  }, [])

  const persistConnection = useCallback(
    (updater: (prev: Record<string, StoredConnectionEntry>) => Record<string, StoredConnectionEntry>) => {
      setConnectionMap((prev) => {
        const next = updater(prev)
        saveConnectionMap(next)
        return next
      })
    },
    [],
  )

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (!q.trim()) return true
      const needle = q.toLowerCase()
      return (
        row.nombre.toLowerCase().includes(needle) ||
        (row.ip || '').toLowerCase().includes(needle) ||
        (row.identificador || '').toLowerCase().includes(needle)
      )
    })
  }, [rows, q])

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  )

  const openNew = () => {
    setEditing({} as DispositivoConfig)
    setForm(defaultForm(tipo))
  }

  const openEdit = (item: DispositivoConfig) => {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      ip: item.ip || '',
      puerto: item.puerto != null ? String(item.puerto) : defaultForm(tipo).puerto,
      habilitado: item.habilitado,
      rolBalanza: (item.rolBalanza as RolBalanza) || 'INGRESO_SALIDA',
      identificador: item.identificador || '',
      descripcion: item.descripcion || '',
    })
  }

  const save = async () => {
    const payload: Record<string, unknown> = {
      tipo,
      nombre: form.nombre.trim(),
      habilitado: form.habilitado,
      descripcion: form.descripcion.trim() || undefined,
    }

    if (tipo === 'PDA') {
      payload.identificador = form.identificador.trim() || undefined
    } else {
      payload.ip = form.ip.trim()
      payload.puerto = parseInt(form.puerto, 10) || (tipo === 'IMPRESORA' ? 9100 : 5000)
    }

    if (tipo === 'BALANZA') {
      payload.rolBalanza = form.rolBalanza
    }

    if (editing?.id) {
      await api.patch(`/configuracion-dispositivos/dispositivos/${editing.id}`, payload)
      const disabledNow = !form.habilitado
      const networkChanged =
        form.ip.trim() !== (editing.ip || '').trim() ||
        (parseInt(form.puerto, 10) || 0) !== (editing.puerto ?? 0)
      if (disabledNow || networkChanged) {
        removeConnectionEntry(editing.id)
        setConnectionMap(loadConnectionMap())
      }
    } else {
      await api.post('/configuracion-dispositivos/dispositivos', payload)
    }

    await load()
    setEditing(null)
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este dispositivo?')) return
    await api.delete(`/configuracion-dispositivos/dispositivos/${id}`)
    removeConnectionEntry(id)
    setConnectionMap(loadConnectionMap())
    await load()
  }

  const testConnection = async (id: string) => {
    setTestingId(id)
    try {
      const response = await api.post(`/configuracion-dispositivos/dispositivos/${id}/probar-conexion`)
      const data = response.data?.data || response.data
      const success = !!data?.success
      persistConnection((prev) => ({
        ...prev,
        [id]: {
          state: success ? 'ok' : 'error',
          message: data?.message || (success ? 'Conexión exitosa' : 'Sin conexión'),
          testedAt: new Date().toISOString(),
        },
      }))
    } catch (error: any) {
      persistConnection((prev) => ({
        ...prev,
        [id]: {
          state: 'error',
          message: error?.message || 'No se pudo probar la conexión',
          testedAt: new Date().toISOString(),
        },
      }))
    } finally {
      setTestingId(null)
    }
  }

  const testPrint = async (id: string, deviceName: string) => {
    setPrintingId(id)
    try {
      const response = await api.post(`/configuracion-dispositivos/dispositivos/${id}/probar-impresion`)
      const data = response.data?.data || response.data
      setPrintResult({
        deviceName,
        success: !!data?.success,
        message: data?.message || (data?.success ? 'Impresión enviada' : 'No se pudo imprimir'),
        detalle: data?.detalle,
      })
    } catch (error: any) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'No se pudo enviar la impresión de prueba'
      setPrintResult({
        deviceName,
        success: false,
        message: typeof backendMsg === 'string' ? backendMsg : 'Error al probar impresión',
      })
    } finally {
      setPrintingId(null)
    }
  }

  const showNetworkFields = tipo === 'IMPRESORA' || tipo === 'BALANZA'
  const showPdaFields = tipo === 'PDA'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-white/60 mt-1">{description}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1">Buscar</label>
          <input
            className="input w-full"
            placeholder="Nombre, IP o identificador"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <button type="button" onClick={openNew} className="btn btn-primary">
          Nuevo dispositivo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[240px] bg-white/5 rounded border border-white/10">
          <span className="text-white/60">Cargando...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {showNetworkFields && <th>IP</th>}
                  {showNetworkFields && <th>Puerto</th>}
                  {tipo === 'BALANZA' && <th>Rol</th>}
                  {showPdaFields && <th>Identificador</th>}
                  <th>Habilitado</th>
                  {showNetworkFields && <th>Conexión</th>}
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-white/50 py-8">
                      No hay dispositivos registrados. Cree uno con &quot;Nuevo dispositivo&quot;.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.nombre}</td>
                      {showNetworkFields && <td>{row.ip || '—'}</td>}
                      {showNetworkFields && <td>{row.puerto ?? '—'}</td>}
                      {tipo === 'BALANZA' && (
                        <td>{row.rolBalanza ? ROL_BALANZA_LABELS[row.rolBalanza as RolBalanza] : '—'}</td>
                      )}
                      {showPdaFields && <td>{row.identificador || '—'}</td>}
                      <td>
                        <span className={row.habilitado ? 'text-green-400' : 'text-white/40'}>
                          {row.habilitado ? 'Sí' : 'No'}
                        </span>
                      </td>
                      {showNetworkFields && (
                        <td>
                          {(() => {
                            const display = getConnectionDisplay(row, connectionMap, testingId)
                            return (
                              <div>
                                <span className={display.className}>{display.text}</span>
                                {display.message && (
                                  <p className="text-xs text-red-300/80 mt-1 max-w-[200px]">
                                    {display.message}
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                        </td>
                      )}
                      <td className="text-right space-x-2 whitespace-nowrap">
                        {showNetworkFields && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={!row.habilitado || testingId === row.id}
                            onClick={() => testConnection(row.id)}
                          >
                            {testingId === row.id ? 'Probando...' : 'Probar'}
                          </button>
                        )}
                        {tipo === 'IMPRESORA' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={!row.habilitado || printingId === row.id}
                            onClick={() => testPrint(row.id, row.nombre)}
                          >
                            {printingId === row.id ? 'Imprimiendo...' : 'Probar impresión'}
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm text-red-300" onClick={() => remove(row.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}

      <Modal open={!!editing} title={editing?.id ? 'Editar dispositivo' : 'Nuevo dispositivo'} onClose={() => setEditing(null)}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nombre *</label>
            <input
              className="input w-full"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder={tipo === 'IMPRESORA' ? 'Impresora principal' : 'Nombre del dispositivo'}
            />
          </div>

          {showNetworkFields && (
            <>
              <div>
                <label className="block text-sm mb-1">Dirección IP *</label>
                <input
                  className="input w-full"
                  value={form.ip}
                  onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
                  placeholder="192.168.1.x"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Puerto *</label>
                <input
                  className="input w-full"
                  value={form.puerto}
                  onChange={(e) => setForm((f) => ({ ...f, puerto: e.target.value.replace(/\D/g, '') }))}
                  placeholder={tipo === 'IMPRESORA' ? '9100' : '5000'}
                />
              </div>
            </>
          )}

          {tipo === 'BALANZA' && (
            <div>
              <label className="block text-sm mb-1">Rol de balanza</label>
              <select
                className="input w-full"
                value={form.rolBalanza}
                onChange={(e) => setForm((f) => ({ ...f, rolBalanza: e.target.value as RolBalanza }))}
              >
                {(Object.keys(ROL_BALANZA_LABELS) as RolBalanza[]).map((key) => (
                  <option key={key} value={key}>
                    {ROL_BALANZA_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showPdaFields && (
            <div>
              <label className="block text-sm mb-1">Identificador del PDA</label>
              <input
                className="input w-full"
                value={form.identificador}
                onChange={(e) => setForm((f) => ({ ...f, identificador: e.target.value }))}
                placeholder="PDA-001, serial, etc."
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Descripción</label>
            <textarea
              className="input w-full min-h-[72px]"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Ubicación, notas..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.habilitado}
              onChange={(e) => setForm((f) => ({ ...f, habilitado: e.target.checked }))}
            />
            Dispositivo habilitado
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!form.nombre.trim() || (showNetworkFields && !form.ip.trim())}
              onClick={save}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!printResult}
        title={printResult?.success ? 'Impresión de prueba enviada' : 'Error en impresión de prueba'}
        onClose={() => setPrintResult(null)}
      >
        {printResult && (
          <div className="space-y-3">
            <p className="text-sm text-white/80">
              <span className="font-semibold">Impresora:</span> {printResult.deviceName}
            </p>
            <div
              className={`rounded px-3 py-2 text-sm border ${
                printResult.success
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {printResult.message}
            </div>
            {printResult.detalle && (
              <pre className="text-xs text-white/50 bg-black/20 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(printResult.detalle, null, 2)}
              </pre>
            )}
            <div className="flex justify-end pt-2">
              <button type="button" className="btn btn-primary" onClick={() => setPrintResult(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
