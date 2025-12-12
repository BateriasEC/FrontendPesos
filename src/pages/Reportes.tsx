import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import '../styles/report-sabanas.css'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { DateRange } from '../components/DateRange'
import { ReportCharts } from '../components/ReportCharts'
import { SabanasTable } from '../components/SabanasTable'
import { Pagination } from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'
import { useSabanaData } from '../hooks/useSabanaData'
import * as XLSX from 'xlsx'

type Row = { id: number; fecha: string; variacion: number; productoId: number; cliente: string }

export default function Reportes() {
  const { rows, loading, load } = useReportData()
  const todayIso = new Date().toISOString().slice(0,10)
  const weekAgoIso = new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10)
  const [range, setRange] = useState({ from: weekAgoIso, to: todayIso })
  const [sabanaRange, setSabanaRange] = useState({ from: weekAgoIso, to: todayIso })
  const [sabanaPage, setSabanaPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { sabanasData, loading: sabanaLoading } = useSabanaData(sabanaRange)

  useEffect(() => { 
    load() 
  }, [load])

  const filtered = useMemo(() => rows.filter(r => {
    const d = new Date(r.fecha)
    const okFrom = !range.from || d >= new Date(range.from)
    const okTo = !range.to || d <= new Date(range.to + 'T23:59:59')
    return okFrom && okTo
  }), [rows, range])

  const byDay = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach(r => {
      const k = new Date(r.fecha).toISOString().slice(0,10)
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day))
  }, [filtered])


  const deviationByProduct = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()
    filtered.forEach(r => {
      const key = String(r.productoId)
      const current = map.get(key) || { sum: 0, count: 0 }
      current.sum += Math.abs(r.variacion)
      current.count += 1
      map.set(key, current)
    })
    return Array.from(map.entries())
      .map(([product, data]) => ({ 
        product: product || 'N/A', 
        avg: data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : 0 
      }))
      .filter(p => p.product !== 'N/A' && p.avg > 0)
  }, [filtered])

  const exportPNG = useCallback(async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'tablero.png'
    link.click()
  }, [])

  const exportPDF = useCallback(async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current)
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('tablero.pdf')
  }, [])

  const exportExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sabana')
    XLSX.writeFile(wb, 'sabana_pesajes.xlsx')
  }, [filtered])

  const exportSabanaExcel = useCallback(() => {
    // Preparar datos para Excel con toda la información
    const excelData: any[] = []
    
    sabanasData.forEach((camion, idx) => {
      // Agregar información del camión
      camion.paletes.forEach((palet, pIdx) => {
        const trit = camion.trituradora[pIdx] || {}
        excelData.push({
          'Camión': idx + 1,
          'Placa': camion.placa,
          'Cliente': camion.cliente || 'N/A',
          'Producto': palet.producto || camion.producto || 'N/A',
          'Fecha': new Date(camion.fecha).toLocaleDateString('es-CO'),
          'Hora Ingreso': camion.horaIngreso,
          'Peso Antes (kg)': camion.pesoAntes,
          'Peso Después (kg)': camion.pesoDespues,
          'Diferencia Camión (kg)': camion.diferencia,
          'Pallet': palet.numero,
          'Peso Real Pallet (kg)': palet.pesoReal,
          'Peso Estimado Pallet (kg)': palet.pesoEstimado,
          'Peso Tolerado Pallet (kg)': palet.pesoTolerado,
          'Estado Pallet': palet.estado === 'ok' ? 'OK' : 'Error',
          'Peso Palet Triturado (kg)': trit.pesoPalet || '',
          'Peso Triturado (kg)': trit.pesoTriturado !== null && trit.pesoTriturado > 0 ? trit.pesoTriturado : '',
          'Diferencia Triturado (kg)': trit.pesoTriturado !== null && trit.pesoTriturado > 0 ? trit.diferencia : '',
          'Estado Triturado': trit.pesoTriturado !== null && trit.pesoTriturado > 0 
            ? (trit.estado === 'ok' ? 'OK' : 'Error')
            : 'Pendiente',
          'Producto Triturado': trit.producto || camion.producto || 'N/A'
        })
      })
    })
    
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 8 },   // Camión
      { wch: 12 },  // Placa
      { wch: 20 },  // Cliente
      { wch: 20 },  // Producto
      { wch: 12 },  // Fecha
      { wch: 12 },  // Hora Ingreso
      { wch: 15 },  // Peso Antes
      { wch: 15 },  // Peso Después
      { wch: 18 },  // Diferencia Camión
      { wch: 8 },   // Pallet
      { wch: 18 },  // Peso Real Pallet
      { wch: 20 },  // Peso Estimado Pallet
      { wch: 20 },  // Peso Tolerado Pallet
      { wch: 15 },  // Estado Pallet
      { wch: 20 },  // Peso Palet Triturado
      { wch: 18 },  // Peso Triturado
      { wch: 20 },  // Diferencia Triturado
      { wch: 15 },  // Estado Triturado
      { wch: 20 }   // Producto Triturado
    ]
    ws['!cols'] = colWidths
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sábanas de Pesajes')
    XLSX.writeFile(wb, `sabanas_pesajes_${sabanaRange.from}_${sabanaRange.to}.xlsx`)
  }, [sabanasData, sabanaRange])

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div className="flex items-end gap-3">
        <DateRange from={range.from} to={range.to} onChange={setRange} />
      </div>

      <section className="flex items-center gap-2">
        <button onClick={exportPNG} className="btn btn-ghost">Exportar PNG</button>
        <button onClick={exportPDF} className="btn btn-ghost">Exportar PDF</button>
        <button onClick={exportExcel} className="btn btn-ghost">Exportar Excel</button>
      </section>

      <div ref={ref}>
        <ReportCharts byDay={byDay} deviationByProduct={deviationByProduct} />
      </div>

      <section className="report-sabanas bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Sábanas de pesajes</h2>
          <div className="flex items-end gap-3">
            <DateRange from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={async () => {
                setSearching(true)
                setSabanaRange(range)
                setSabanaPage(1)
                // Esperar un momento para que el hook se actualice
                setTimeout(() => setSearching(false), 500)
              }}
              disabled={searching || sabanaLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
            >
              {searching || sabanaLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>🔍</span> Buscar
                </>
              )}
            </button>
            <button
              onClick={exportSabanaExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
            >
              <span>📊</span> Exportar Excel
            </button>
          </div>
        </div>
        
        {sabanaLoading || searching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white/60">Cargando datos...</p>
            </div>
          </div>
        ) : sabanasData.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg">No hay datos para el rango de fechas seleccionado</p>
            <p className="text-sm mt-2 text-white/40">Rango: {sabanaRange.from} a {sabanaRange.to}</p>
          </div>
        ) : (
          <>
            <SabanasTable data={sabanasData.slice((sabanaPage - 1) * 10, sabanaPage * 10)} />
            <div className="mt-6 flex justify-end">
              <Pagination 
                page={sabanaPage} 
                pageSize={10} 
                total={sabanasData.length} 
                onChange={setSabanaPage} 
              />
            </div>
          </>
        )}
      </section>
    </div>
  )
}


