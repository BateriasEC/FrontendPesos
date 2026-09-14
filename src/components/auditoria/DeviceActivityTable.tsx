import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../../services/api'
import { DateRange } from '../DateRange'

type DeviceActivity = {
  deviceId: string
  nombre: string
  habilitado: boolean
  registrado: boolean
  totalOperaciones: number
  totalErrores: number
  ultimaActividad: string | null
}

function formatDate(value: string | null) {
  if (!value) return 'Sin actividad'
  return new Date(value).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DeviceActivityTable() {
  const [rows, setRows] = useState<DeviceActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState({ from: '', to: '' })
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/auditoria/dispositivos', {
        params: { from: range.from || undefined, to: range.to || undefined },
      })
      // El backend envuelve toda respuesta en { data: ... } (TransformInterceptor)
      setRows(res.data?.data ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const exportExcel = async () => {
    if (rows.length === 0) {
      alert('No hay actividad de dispositivos en este rango para exportar.')
      return
    }

    setExporting(true)
    try {
      // Deja pintar el estado "Exportando..." antes de armar el archivo.
      await new Promise((resolve) => setTimeout(resolve, 0))

      const excelData = rows.map((row, idx) => ({
        'N°': idx + 1,
        Dispositivo: row.nombre,
        Identificador: row.deviceId,
        Estado: !row.registrado ? 'No registrado' : row.habilitado ? 'Habilitado' : 'Deshabilitado',
        Operaciones: row.totalOperaciones,
        Errores: row.totalErrores,
        'Última actividad': formatDate(row.ultimaActividad),
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      ws['!cols'] = [
        { wch: 6 }, // N°
        { wch: 24 }, // Dispositivo
        { wch: 26 }, // Identificador
        { wch: 16 }, // Estado
        { wch: 14 }, // Operaciones
        { wch: 12 }, // Errores
        { wch: 20 }, // Última actividad
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dispositivos')

      const fechaActual = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `auditoria_dispositivos_${fechaActual}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-white/60 max-w-xl">
          Identifica desde qué PDA se realizan las operaciones. Un dispositivo &quot;no
          registrado&quot; envió operaciones pero aún no fue dado de alta en el catálogo de PDAs.
        </p>
        <div className="flex items-end gap-3">
          <DateRange from={range.from} to={range.to} onChange={setRange} />
          <button
            type="button"
            onClick={exportExcel}
            disabled={exporting}
            className="h-10 px-4 text-sm rounded-lg bg-green-600 hover:bg-green-700 transition font-medium whitespace-nowrap disabled:opacity-50"
          >
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="table">
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Identificador</th>
              <th>Estado</th>
              <th className="text-right">Operaciones</th>
              <th className="text-right">Errores</th>
              <th>Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/60">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/60">
                  No hay actividad de dispositivos en este rango.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.deviceId} className="border-t border-white/10">
                  <td>{row.nombre}</td>
                  <td className="font-mono text-xs">{row.deviceId}</td>
                  <td>
                    {!row.registrado ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                        No registrado
                      </span>
                    ) : row.habilitado ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
                        Habilitado
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/60 border border-white/20">
                        Deshabilitado
                      </span>
                    )}
                  </td>
                  <td className="text-right">{row.totalOperaciones}</td>
                  <td className="text-right">
                    {row.totalErrores > 0 ? (
                      <span className="text-red-400">{row.totalErrores}</span>
                    ) : (
                      row.totalErrores
                    )}
                  </td>
                  <td className="text-white/60">{formatDate(row.ultimaActividad)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
