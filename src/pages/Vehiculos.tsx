import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'

type Vehiculo = { 
  id: number; 
  placa: string; 
  cliente: string; 
  estado: 'en_planta' | 'salido'; 
  ingresoAt: string; 
  salidaAt?: string 
}

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
      const vehicles = response.data?.data || response.data || []
      const mappedVehicles = vehicles.map((v: any) => {
        const estadoCodigo = v.estado?.codigo || v.estado || 'EN_PLANTA'
        let estadoMapped: 'en_planta' | 'salido' = 'en_planta'
        if (estadoCodigo === 'SALIDO' || estadoCodigo === 'salido') {
          estadoMapped = 'salido'
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
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">VEHÍCULOS</h1>

      {/* Filtros */}
      <div className="grid sm:grid-cols-3 gap-4">
        <input
          className="input bg-white/5 border border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded p-2 transition"
          placeholder="Buscar por placa o cliente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="select bg-white/5 border border-white/20 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded p-2 transition"
          value={estado}
          onChange={(e) => setEstado(e.target.value as any)}
        >
          <option value="">TODOS</option>
          <option value="en_planta">EN PROCESO</option>
          <option value="salido">DESCARGADO</option>
        </select>

        <button
          onClick={load}
          className="btn btn-primary"
        >
          RECARGAR
        </button>
      </div>

      {/* Tabla Desktop */}
      {loading ? (
        <div className="hidden md:flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando vehículos...</p>
          </div>
        </div>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded-lg shadow-lg border border-white/10">
          <table className="table-auto w-full text-left">
            <thead className="bg-white/10 text-white uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Ingreso</th>
                <th className="p-3">Salida</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No hay vehículos registrados
                  </td>
                </tr>
              ) : (
                pageRows.map((v, i) => (
                  <tr key={v.id} className={`transition hover:bg-white/10 ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                    <td className="p-3 text-sm">{`COD-${String(v.id).padStart(3,'0')}`}</td>
                    <td className="p-3 text-sm font-medium">{v.placa}</td>
                    <td className="p-3 text-sm">{v.cliente}</td>
                    <td className="p-3 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-center w-24 
                        bg-green-500/30 text-green-200
                        dark:bg-gray-500/30 dark:text-gray-300
                      ">
                        {v.estado === 'en_planta' ? 'EN PROCESO' : 'DESCARGADO'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{formatDate(v.ingresoAt)}</td>
                    <td className="p-3 text-sm">{formatDate(v.salidaAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards Móvil */}
      {loading ? (
        <div className="md:hidden flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando vehículos...</p>
          </div>
        </div>
      ) : (
        <div className="md:hidden space-y-4">
          {pageRows.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-white/5 rounded border border-white/10">
              No hay vehículos registrados
            </div>
          ) : (
            pageRows.map((v) => (
              <div key={v.id} className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10 p-4 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{v.placa}</h3>
                    <p className="text-sm text-gray-300 mt-1">{v.cliente}</p>
                    <p className="text-xs text-gray-400 mt-1">{`COD-${String(v.id).padStart(3,'0')}`}</p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-center w-24 
                    bg-green-500/30 text-green-200
                    dark:bg-gray-500/30 dark:text-gray-300
                  ">
                    {v.estado === 'en_planta' ? 'EN PROCESO' : 'DESCARGADO'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/20 space-y-1 text-sm">
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
        <div className="flex justify-end mt-4">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
