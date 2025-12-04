import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import '../styles/report-sabanas.css'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { DateRange } from '../components/DateRange'
import { ReportCharts } from '../components/ReportCharts'
import { SabanasTable } from '../components/SabanasTable'
import { useReportData } from '../hooks/useReportData'
import { useSabanaData } from '../hooks/useSabanaData'
import * as XLSX from 'xlsx'

type Row = { id: number; fecha: string; variacion: number; productoId: number; cliente: string }

export default function Reportes() {
  const { rows, loading, load } = useReportData()
  const todayIso = new Date().toISOString().slice(0,10)
  const weekAgoIso = new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10)
  const [range, setRange] = useState({ from: weekAgoIso, to: todayIso })
  const ref = useRef<HTMLDivElement>(null)
  const sabanasData = useSabanaData(range)

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
    return Array.from(map.entries()).map(([day, total]) => ({ day, total }))
  }, [filtered])


  const deviationByProduct = useMemo(() => {
    const map = new Map<string, number[]>()
    filtered.forEach(r => {
      const key = String(r.productoId)
      const arr = map.get(key) || []
      arr.push(r.variacion)
      map.set(key, arr)
    })
    return Array.from(map.entries()).map(([product, arr]) => ({ product, avg: arr.reduce((a,b)=>a+b,0)/arr.length }))
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

      <section className="report-sabanas bg-white/5 border border-white/10 rounded p-4">
        <div className="flex items-end gap-3 mb-4">
          <h2 className="font-semibold flex-1">Sábanas de pesajes</h2>
          <DateRange from={range.from} to={range.to} onChange={setRange} />
        </div>
        <SabanasTable data={sabanasData} />
      </section>
    </div>
  )
}


