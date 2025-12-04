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
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.get('/vehicles')
      // El backend devuelve { data: [...] } por el TransformInterceptor
      const vehicles = response.data?.data || response.data || []
      // Mapear el formato del backend al formato esperado por la web
      const mappedVehicles = vehicles.map((v: any) => {
        const estadoCodigo = v.estado?.codigo || v.estado || 'EN_PLANTA'
        // Convertir EN_PLANTA -> en_planta, SALIDO -> salido
        let estadoMapped: 'en_planta' | 'salido' = 'en_planta'
        if (estadoCodigo === 'SALIDO' || estadoCodigo === 'salido') {
          estadoMapped = 'salido'
        } else {
          estadoMapped = 'en_planta'
        }
        
        return {
          id: v.id,
          placa: v.placa || v.codigoTrazabilidad || '',
          cliente: v.cliente || '',
          estado: estadoMapped,
          ingresoAt: v.ingresoAt || v.createdAt || new Date().toISOString(),
          salidaAt: estadoCodigo === 'SALIDO' ? (v.salidaAt || v.updatedAt) : undefined
        }
      })
      setRows(mappedVehicles)
    } catch (error: any) {
      console.error('Error cargando vehículos:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.placa.toLowerCase().includes(q.toLowerCase()) || r.cliente.toLowerCase().includes(q.toLowerCase())) &&
    (!estado || r.estado === estado)
  )), [rows, q, estado])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando vehículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Vehículos</h1>
      
      <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1">Buscar</label>
          <input 
            className="w-full input" 
            placeholder="Placa o cliente" 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
          />
        </div>
        <div className="w-full sm:w-auto min-w-[150px]">
          <label className="block text-sm mb-1">Estado</label>
          <select 
            className="w-full select" 
            value={estado} 
            onChange={e=>setEstado(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value="en_planta">En planta</option>
            <option value="salido">Salido</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="table table-zebra w-full min-w-[600px]">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left whitespace-nowrap">Código</th>
              <th className="p-2 text-left whitespace-nowrap">Placa</th>
              <th className="p-2 text-left whitespace-nowrap">Cliente</th>
              <th className="p-2 text-left whitespace-nowrap">Estado</th>
              <th className="p-2 text-left whitespace-nowrap">Ingreso</th>
              <th className="p-2 text-left whitespace-nowrap">Salida</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  No hay vehículos registrados
                </td>
              </tr>
            ) : (
              pageRows.map((v, i) => (
                <tr key={v.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="p-2 whitespace-nowrap">{`COD-${String(v.id).padStart(3,'0')}`}</td>
                  <td className="p-2 whitespace-nowrap">{v.placa}</td>
                  <td className="p-2">{v.cliente}</td>
                  <td className="p-2 capitalize whitespace-nowrap">{v.estado.replace('_',' ')}</td>
                  <td className="p-2 whitespace-nowrap text-sm">{formatDate(v.ingresoAt)}</td>
                  <td className="p-2 whitespace-nowrap text-sm">{formatDate(v.salidaAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
      </div>
    </div>
  )
}


