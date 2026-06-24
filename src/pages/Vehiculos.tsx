import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { PlacaSearchInput } from '../components/PlacaSearchInput'

type Vehiculo = { 
  id: number; 
  placa: string; 
  cliente: string; 
  producto?: string;
  canalVehiculo?: string;
  tipoOperacion?: string;
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
  const [debouncedQ, setDebouncedQ] = useState('')
  const [estado, setEstado] = useState<Vehiculo['estado'] | ''>('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalEnPlanta, setTotalEnPlanta] = useState(0)
  const [totalSalido, setTotalSalido] = useState(0)

  const pageSize = 10

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, estado]);

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/vehicles', {
        params: {
          page,
          limit: pageSize,
          search: debouncedQ || undefined,
          estado: estado || undefined,
        }
      })
      const responseData = response.data?.data ?? response.data
      const vehicles = responseData?.data || []
      const totalCount = responseData?.total ?? 0
      const enPlantaCount = responseData?.totalEnPlanta ?? 0
      const salidoCount = responseData?.totalSalido ?? 0

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
          producto: v.product?.nombre || v.producto?.nombre || 'N/A',
          canalVehiculo: v.canalVehiculo?.nombre || v.canalVehiculo?.nombre || 'N/A',
          tipoOperacion: v.tipoRecepcion?.nombre || 'N/A',
          estado: estadoMapped,
          ingresoAt: v.ingresoAt || v.createdAt || new Date().toISOString(),
          salidaAt: estadoCodigo === 'SALIDO' ? (v.salidaAt || v.updatedAt) : undefined
        }
      })
      setRows(mappedVehicles)
      setTotal(totalCount)
      setTotalEnPlanta(enPlantaCount)
      setTotalSalido(salidoCount)
    } catch (error: any) {
      console.error('Error cargando vehículos:', error)
      setRows([])
      setTotal(0)
      setTotalEnPlanta(0)
      setTotalSalido(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, estado])
  
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <h1 className="text-2xl font-bold">VEHÍCULOS</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">
            Total Vehículos
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {total}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">
            En Proceso
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-400">
            {totalEnPlanta}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">
            Descargados
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-400">
            {totalSalido}
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 justify-end w-full">
            <label className="text-xs text-gray-400 font-medium">Placa</label>
            <PlacaSearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar placa..."
              inPlant={false}
            />
          </div>

          <div className="flex flex-col gap-1 justify-end w-full">
            <label className="text-xs text-gray-400 font-medium">Estado</label>
            <select
              className="select h-11 w-full text-sm"
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
            >
              <option value="">TODOS</option>
              <option value="en_planta">EN PROCESO</option>
              <option value="salido">DESCARGADO</option>
            </select>
          </div>

          <div className="flex justify-end self-end">
            <button
              onClick={load}
              className="h-10 px-4 text-sm rounded-lg bg-brand-orange hover:bg-brand-orange/80 transition font-medium whitespace-nowrap"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-orange" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="table w-full">
            <thead className="bg-white/10 sticky top-0 z-10">
              <tr>
                <th>Código</th>
                <th>Placa</th>
                <th>Producto</th>
                <th>Tipo operación</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th>Salida</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No hay vehículos registrados
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition">
                    <td className="font-mono text-sm">{`COD-${String(v.id).padStart(3,'0')}`}</td>
                    <td className="font-medium">{v.placa}</td>
                    <td className="text-sm text-gray-300">{v.producto || 'N/A'}</td>
                    <td>{v.tipoOperacion || 'N/A'}</td>
                    <td className="text-sm">{v.canalVehiculo || 'N/A'}</td>
                    <td>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        v.estado === 'en_planta' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {v.estado === 'en_planta' ? 'EN PROCESO' : 'DESCARGADO'}
                      </span>
                    </td>
                    <td className="text-sm">{formatDate(v.ingresoAt)}</td>
                    <td className="text-sm">{formatDate(v.salidaAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-400">
          {total > 0 ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros` : 'No hay registros'}
        </span>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
        />
      </div>
    </div>
  )
}
