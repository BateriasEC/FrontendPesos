import { useEffect, useMemo, useState, useCallback } from 'react'
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

  const load = useCallback(async () => {
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
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.placa.toLowerCase().includes(q.toLowerCase()) || r.cliente.toLowerCase().includes(q.toLowerCase())) &&
    (!estado || r.estado === estado)
  )), [rows, q, estado])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Vehículos</h1>
      
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Buscar</label>
            <input 
              className="w-full input text-sm" 
              placeholder="Placa o cliente" 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Estado</label>
            <select 
              className="w-full select text-sm" 
              value={estado} 
              onChange={e=>setEstado(e.target.value as any)}
            >
              <option value="">Todos</option>
              <option value="en_planta">En planta</option>
              <option value="salido">Salido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vista de tabla para desktop */}
      {loading ? (
        <div className="hidden md:flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando vehículos...</p>
          </div>
        </div>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded border border-white/10">
          <table className="table table-zebra w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 text-left text-sm">Código</th>
                <th className="p-2 text-left text-sm">Placa</th>
                <th className="p-2 text-left text-sm">Cliente</th>
                <th className="p-2 text-left text-sm">Estado</th>
                <th className="p-2 text-left text-sm">Ingreso</th>
                <th className="p-2 text-left text-sm">Salida</th>
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
                    <td className="p-2 text-sm">{`COD-${String(v.id).padStart(3,'0')}`}</td>
                    <td className="p-2 text-sm">{v.placa}</td>
                    <td className="p-2 text-sm">{v.cliente}</td>
                    <td className="p-2 text-sm capitalize">{v.estado.replace('_',' ')}</td>
                    <td className="p-2 text-sm">{formatDate(v.ingresoAt)}</td>
                    <td className="p-2 text-sm">{formatDate(v.salidaAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista de cards para móvil */}
      {loading ? (
        <div className="md:hidden flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando vehículos...</p>
          </div>
        </div>
      ) : (
        <div className="md:hidden space-y-3">
          {pageRows.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-white/5 rounded border border-white/10">
              No hay vehículos registrados
            </div>
          ) : (
            pageRows.map((v) => (
            <div key={v.id} className="bg-white/5 rounded border border-white/10 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{v.placa}</h3>
                  <p className="text-sm text-gray-300 mt-1">{v.cliente}</p>
                  <p className="text-xs text-gray-400 mt-1">{`COD-${String(v.id).padStart(3,'0')}`}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs capitalize ${
                  v.estado === 'en_planta' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {v.estado.replace('_',' ')}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ingreso:</span>
                  <span className="text-gray-300">{formatDate(v.ingresoAt)}</span>
                </div>
                {v.salidaAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Salida:</span>
                    <span className="text-gray-300">{formatDate(v.salidaAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  )
}


