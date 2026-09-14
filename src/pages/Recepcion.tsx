import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { DateRange } from '../components/DateRange'
import { Pagination } from '../components/Pagination'

type RecepcionRow = {
  id: string
  codigoRecepcion: string
  codigoPallet: string
  placa: string
  cliente: string
  producto: string
  pesoDespacho: number
  pesoRecibido: number
  diferenciaPeso: number
  diferenciaPorcentaje: number | null
  recibidoPor: string
  recibidoAt: string
  observacion?: string | null
}

export default function Recepcion() {
  const [rows, setRows] = useState<RecepcionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (range.from) params.set('fecha_inicio', range.from)
      if (range.to) params.set('fecha_fin', range.to)
      const qs = params.toString()
      const res = await api.get(`/pallets/recepciones${qs ? `?${qs}` : ''}`)
      const data = res.data?.data ?? res.data ?? []
      setRows(
        (Array.isArray(data) ? data : []).map((r: any) => ({
          id: r.id,
          codigoRecepcion: r.codigoRecepcion,
          codigoPallet: r.pallet?.codigoIndependiente || r.pallet?.codigo || 'N/A',
          placa: r.pallet?.vehicle?.placa || 'N/A',
          cliente: r.pallet?.vehicle?.cliente || 'N/A',
          producto: r.pallet?.product?.nombre || 'N/A',
          pesoDespacho: Number(r.pesoDespacho),
          pesoRecibido: Number(r.pesoRecibido),
          diferenciaPeso: Number(r.diferenciaPeso),
          diferenciaPorcentaje: r.diferenciaPorcentaje != null ? Number(r.diferenciaPorcentaje) : null,
          recibidoPor: r.recibidoPor?.fullName || r.recibidoPor?.username || 'N/A',
          recibidoAt: r.recibidoAt,
          observacion: r.observacion,
        })),
      )
    } catch (e) {
      console.error('Error cargando recepciones:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.codigoRecepcion.toLowerCase().includes(term) ||
        r.codigoPallet.toLowerCase().includes(term) ||
        r.placa.toLowerCase().includes(term) ||
        r.cliente.toLowerCase().includes(term),
    )
  }, [rows, q])

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const formatDiff = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(2)} kg`
  }

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-2xl font-bold">Recepción de Pallets</h1>
        <p className="text-sm text-white/70 mt-1">
          Consulta de recepciones registradas en Producción y diferencias vs peso despachado.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="flex-1">
          <label className="block text-sm mb-1">Buscar</label>
          <input
            className="input w-full"
            placeholder="Código recepción, pallet, placa..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
        <DateRange from={range.from} to={range.to} onChange={(v) => { setRange(v); setPage(1) }} />
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left">Cód. Recepción</th>
              <th className="p-2 text-left">Pallet</th>
              <th className="p-2 text-left">Placa</th>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-right">Peso Despacho</th>
              <th className="p-2 text-right">Peso Recibido</th>
              <th className="p-2 text-right">Diferencia</th>
              <th className="p-2 text-left">Recibido por</th>
              <th className="p-2 text-left">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-white/60">Cargando...</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-white/60">Sin recepciones registradas</td></tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="p-2 font-mono text-xs">{r.codigoRecepcion}</td>
                  <td className="p-2">{r.codigoPallet}</td>
                  <td className="p-2">{r.placa}</td>
                  <td className="p-2">{r.producto}</td>
                  <td className="p-2 text-right">{r.pesoDespacho.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.pesoRecibido.toFixed(2)}</td>
                  <td className={`p-2 text-right font-semibold ${Math.abs(r.diferenciaPeso) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatDiff(r.diferenciaPeso)}
                    {r.diferenciaPorcentaje != null && (
                      <span className="block text-xs opacity-80">
                        ({r.diferenciaPorcentaje > 0 ? '+' : ''}{r.diferenciaPorcentaje.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                  <td className="p-2">{r.recibidoPor}</td>
                  <td className="p-2">{new Date(r.recibidoAt).toLocaleString('es-EC')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
    </div>
  )
}
