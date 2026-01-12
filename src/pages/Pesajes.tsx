import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import * as XLSX from 'xlsx'
import { Pagination } from '../components/Pagination'
import { DateRange } from '../components/DateRange'
import { LabelModal } from '../components/LabelModal'

type Nivel = { nivel: number; MED: number; G1: number; P1: number; P2: number; P3: number; P4: number }
type Row = {
  id: number | string
  fecha: string
  placa: string
  codigoPallet: string
  pesoIngreso: number
  pesoSalida: number | null
  variacion: number
  productoId: number | string
  cliente: string
  niveles?: Nivel[]
  vehicleId?: string
  codigoTrazabilidad?: string
  productNombre?: string
  pesoTotal?: number
  pesoDescarga?: number | null
  variacionPeso?: number | null
  descargado?: boolean
}

export default function Pesajes() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [producto] = useState('')
  const [cliente] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Usar el endpoint correcto del backend: /pallets
      const response = await api.get('/pallets')
      // El backend devuelve { data: { data: [...], total, ... } } por el TransformInterceptor
      // O puede devolver directamente { data: [...], total, ... }
      const responseData = response.data?.data || response.data
      let pallets: any[] = []
      
      // Si es un objeto paginado, extraer el array de data
      if (responseData && Array.isArray(responseData.data)) {
        pallets = responseData.data
      } else if (Array.isArray(responseData)) {
        pallets = responseData
      }
      
      // Mapear el formato del backend al formato esperado por la web
      const mappedWeighings = pallets.map((p: any) => {
        // Construir niveles desde los campos nivel1Med, nivel1G1, etc.
        const niveles = []
        for (let i = 1; i <= 5; i++) {
          niveles.push({
            nivel: i,
            MED: p[`nivel${i}Med`] || 0,
            G1: p[`nivel${i}G1`] || 0,
            P1: p[`nivel${i}P1`] || 0,
            P2: p[`nivel${i}P2`] || 0,
            P3: p[`nivel${i}P3`] || 0,
            P4: p[`nivel${i}P4`] || 0,
          })
        }
        
        // Debug: Log para ver qué datos vienen del backend
        if (p.vehicle) {
          console.log('[Pesajes] Datos del vehículo:', {
            placa: p.vehicle.placa,
            pesoIngreso: p.vehicle.pesoIngreso,
            pesoSalida: p.vehicle.pesoSalida,
            pesoSalidaType: typeof p.vehicle.pesoSalida,
            pesoSalidaValue: p.vehicle.pesoSalida
          });
        }
        
        // Usar pesoIngreso y pesoSalida del vehículo, no del pallet
        // Convertir Decimal a number si es necesario
        const pesoIngreso = p.vehicle?.pesoIngreso 
          ? (typeof p.vehicle.pesoIngreso === 'string' ? parseFloat(p.vehicle.pesoIngreso) : Number(p.vehicle.pesoIngreso))
          : (Number(p.pesoTotal) || 0);
        
        const pesoSalidaRaw = p.vehicle?.pesoSalida;
        const pesoSalida = pesoSalidaRaw !== null && pesoSalidaRaw !== undefined && pesoSalidaRaw !== ''
          ? (typeof pesoSalidaRaw === 'string' ? parseFloat(pesoSalidaRaw) : Number(pesoSalidaRaw))
          : null;
        
        const variacion = pesoSalida !== null && pesoIngreso > 0 
          ? pesoIngreso - pesoSalida 
          : (p.descargado ? (Number(p.variacionPeso) || 0) : 0);
        
        // Debug: Log del resultado final
        console.log('[Pesajes] Mapeo final:', {
          placa: p.vehicle?.placa,
          pesoIngreso,
          pesoSalida,
          variacion
        });
        
        return {
          id: p.id,
          fecha: p.createdAt || new Date().toISOString(),
          placa: p.vehicle?.placa || p.vehicle?.codigoTrazabilidad || '',
          codigoPallet: p.codigo || '',
          pesoIngreso: pesoIngreso,
          pesoSalida: pesoSalida,
          variacion: variacion,
          productoId: p.productId || p.product?.id || '',
          cliente: p.vehicle?.cliente || '',
          niveles: niveles,
          vehicleId: p.vehicleId || p.vehicle?.id || '',
          codigoTrazabilidad: p.vehicle?.codigoTrazabilidad || '',
          productNombre: p.product?.nombre || '',
          pesoTotal: Number(p.pesoTotal) || 0,
          pesoDescarga: p.descargado && p.pesoDescarga ? Number(p.pesoDescarga) : null,
          variacionPeso: p.variacionPeso ? Number(p.variacionPeso) : null,
          descargado: p.descargado === true || p.descargado === 1
        }
      })
      setRows(mappedWeighings)
    } catch (error: any) {
      console.error('Error cargando pesajes:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter(r => {
    const okQ = !q || r.placa.toLowerCase().includes(q.toLowerCase()) || r.codigoPallet.toLowerCase().includes(q.toLowerCase())
    const okProd = !producto || String(r.productoId) === producto
    const okCli = !cliente || r.cliente.toLowerCase().includes(cliente.toLowerCase())
    const d = new Date(r.fecha)
    const okFrom = !range.from || d >= new Date(range.from)
    const okTo = !range.to || d <= new Date(range.to + 'T23:59:59')
    return okQ && okProd && okCli && okFrom && okTo
  }), [rows, q, producto, cliente, range])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pesajes')
    XLSX.writeFile(wb, 'pesajes.xlsx')
  }

  const [labelRow, setLabelRow] = useState<Row | null>(null)

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Pesajes</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm">Buscar</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="mt-1 input" placeholder="Placa o Código Pallet" />
        </div>
        {/* <div>
          <label className="block text-sm">Producto</label>
          <input value={producto} onChange={e=>setProducto(e.target.value)} className="mt-1 input" placeholder="ID producto" />
        </div>
        <div>
          <label className="block text-sm">Cliente</label>
          <input value={cliente} onChange={e=>setCliente(e.target.value)} className="mt-1 input" placeholder="Cliente" />
        </div>
        <div>
          <label className="block text-sm">Umbral alerta (kg)</label>
          <input className="mt-1 input" type="number" value={threshold} onChange={e=>setThreshold(Number(e.target.value)||0)} />
        </div> */}
        
        <div className="flex gap-2 items-end">
          <DateRange from={range.from} to={range.to} onChange={setRange} />
          <button 
            onClick={exportExcel} 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors duration-200 whitespace-nowrap"
          >
            Exportar Excel
          </button>
        </div>
      </div>
      

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando pesajes...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="table table-zebra w-full min-w-[800px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Placa</th>
                  <th className="text-left p-2">Código Pallet</th>
                  <th className="text-left p-2">Peso Ingreso (kg)</th>
                  <th className="text-left p-2">Peso Salida (kg)</th>
                  <th className="text-left p-2">Variación (kg)</th>
                  <th className="text-left p-2 w-40">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400">
                      No hay pesajes registrados
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                      <td className="p-2">{new Date(r.fecha).toLocaleString()}</td>
                      <td className="p-2">{r.placa}</td>
                      <td className="p-2">{r.codigoPallet}</td>
                      <td className="p-2">{r.pesoIngreso?.toLocaleString(undefined,{maximumFractionDigits:2})} kg</td>
                      <td className="p-2">{r.pesoSalida!=null ? `${r.pesoSalida.toLocaleString(undefined,{maximumFractionDigits:2})} kg` : '-'}</td>
                      <td className="p-2">{r.variacion?.toLocaleString(undefined,{maximumFractionDigits:2})} kg</td>
                      <td className="p-2 flex gap-2">
                        <button onClick={()=>setLabelRow(r)} className="text-xs btn btn-ghost w-24 text-center">Etiqueta</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
          </div>
        </>
      )}

      

      <LabelModal 
        labelData={labelRow ? {
          id: String(labelRow.id),
          codigoPallet: labelRow.codigoPallet,
          placa: labelRow.placa,
          cliente: labelRow.cliente,
          codigoTrazabilidad: labelRow.codigoTrazabilidad || '',
          fecha: labelRow.fecha,
          productNombre: labelRow.productNombre || '',
          pesoIngreso: labelRow.pesoIngreso,
          pesoSalida: labelRow.pesoSalida,
          pesoTotal: labelRow.pesoTotal || 0,
          pesoDescarga: labelRow.pesoDescarga || null,
          variacionPallet: labelRow.variacionPeso !== null && labelRow.variacionPeso !== undefined 
            ? labelRow.variacionPeso 
            : (labelRow.pesoDescarga && labelRow.pesoTotal 
              ? labelRow.pesoDescarga - labelRow.pesoTotal 
              : null),
          variacionVehiculo: labelRow.variacion,
          descargado: labelRow.descargado || false,
          vehicleId: labelRow.vehicleId || '',
          niveles: labelRow.niveles || []
        } : null}
        onClose={() => setLabelRow(null)}
      />
    </div>
  )
}


