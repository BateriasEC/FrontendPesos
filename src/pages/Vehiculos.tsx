import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'

type Vehiculo = { id: number; placa: string; cliente: string; estado: 'en_planta' | 'salido'; ingresoAt: string; salidaAt?: string }

function formatDate(s?: string) {
  return s ? new Date(s).toLocaleString() : '-'
}

export default function Vehiculos() {
  const [rows, setRows] = useState<Vehiculo[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<Vehiculo['estado'] | ''>('')

  const load = async () => { const { data } = await api.get('/vehicles'); setRows(data) }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.placa.toLowerCase().includes(q.toLowerCase()) || r.cliente.toLowerCase().includes(q.toLowerCase())) &&
    (!estado || r.estado === estado)
  )), [rows, q, estado])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input className="mt-1 input" placeholder="Placa o cliente" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Estado</label>
          <select className="mt-1 select" value={estado} onChange={e=>setEstado(e.target.value as any)}>
            <option value="">Todos</option>
            <option value="en_planta">En planta</option>
            <option value="salido">Salido</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="table table-zebra">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Placa</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Ingreso</th>
              <th className="p-2 text-left">Salida</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((v, i) => (
              <tr key={v.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{`COD-${String(v.id).padStart(3,'0')}`}</td>
                <td className="p-2">{v.placa}</td>
                <td className="p-2">{v.cliente}</td>
                <td className="p-2 capitalize">{v.estado.replace('_',' ')}</td>
                <td className="p-2">{formatDate(v.ingresoAt)}</td>
                <td className="p-2">{formatDate(v.salidaAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
      </div>
    </div>
  )
}


