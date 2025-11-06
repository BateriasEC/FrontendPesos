import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/report-sabanas.css'
import { api } from '../services/api'
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, LineChart, Line } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { DateRange } from '../components/DateRange'
import * as XLSX from 'xlsx'

type Row = { id: number; fecha: string; variacion: number; productoId: number; cliente: string }

// Tipo para datos de sábanas de pesajes
type SabanaData = {
  placa: string
  pesoAntes: number
  pesoDespues: number
  diferencia: number
  horaIngreso: string
  fecha: string
  paletes: Array<{
    numero: number
    pesoReal: number
    pesoEstimado: number
    pesoTolerado: number
    estado: 'ok' | 'error'
  }>
  trituradora: Array<{
    numero: number
    pesoPalet: number
    pesoTriturado: number
    diferencia: number
    estado: 'ok' | 'error'
  }>
}

export default function Reportes() {
  const [rows, setRows] = useState<Row[]>([])
  const todayIso = new Date().toISOString().slice(0,10)
  const weekAgoIso = new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10)
  const [range, setRange] = useState({ from: weekAgoIso, to: todayIso })
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const { data } = await api.get('/weighings');
      if (Array.isArray(data) && data.length > 0) {
        setRows(data)
      } else {
        // Generar datos de ejemplo (últimos 14 días)
        const tmp: Row[] = []
        const now = new Date()
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now.getTime() - i*24*60*60*1000)
          const count = Math.floor(Math.random()*8)+2 // 2..9 pesajes
          for (let j=0;j<count;j++) {
            tmp.push({ id: i*10+j, fecha: new Date(d.getTime()+j*60*60*1000).toISOString(), variacion: Math.round((Math.random()*60-30)*10)/10, productoId: Math.floor(Math.random()*3)+1, cliente: ['Cliente A','Rubix','Cliente B'][Math.floor(Math.random()*3)] })
          }
        }
        setRows(tmp)
      }
    } catch {
      // Si falla la API, también generamos ejemplo
      const tmp: Row[] = []
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i*24*60*60*1000)
        const count = Math.floor(Math.random()*8)+2
        for (let j=0;j<count;j++) {
          tmp.push({ id: i*10+j, fecha: new Date(d.getTime()+j*60*60*1000).toISOString(), variacion: Math.round((Math.random()*60-30)*10)/10, productoId: Math.floor(Math.random()*3)+1, cliente: ['Cliente A','Rubix','Cliente B'][Math.floor(Math.random()*3)] })
        }
      }
      setRows(tmp)
    }
  }
  useEffect(() => { load() }, [])

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

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sabana')
    XLSX.writeFile(wb, 'sabana_pesajes.xlsx')
  }

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

  // Generar datos simulados de sábanas de pesajes según el rango de fechas
  const sabanasData = useMemo(() => {
    const data: SabanaData[] = []
    const startDate = new Date(range.from)
    const endDate = new Date(range.to)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    // Generar 1-3 camiones por día en el rango
    let camionId = 1
    for (let i = 0; i < diffDays; i++) {
      const fecha = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const numCamiones = Math.floor(Math.random() * 3) + 1 // 1-3 camiones por día
      
      for (let j = 0; j < numCamiones; j++) {
        const hora = String(Math.floor(Math.random() * 8) + 8).padStart(2, '0') + ':' + 
                     String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const pesoAntes = Math.floor(Math.random() * 5000) + 10000 // 10000-15000 kg
        const pesoDespues = Math.floor(pesoAntes * 0.65) + Math.floor(Math.random() * 1000) // ~65% del peso antes
        const diferencia = pesoAntes - pesoDespues
        const numPaletes = Math.floor(Math.random() * 3) + 2 // 2-4 paletes
        
        const paletes = []
        const trituradora = []
        
        for (let p = 1; p <= numPaletes; p++) {
          // Datos para PALETES
          const pesoReal = Math.floor(Math.random() * 50) + 450 // 450-500 kg
          const pesoEstimado = pesoReal + Math.floor(Math.random() * 10) - 5 // ±5 kg del real
          const pesoTolerado = Math.abs(pesoReal - pesoEstimado)
          const estadoPaletes = pesoTolerado <= 3 ? 'ok' : 'error'
          
          // Datos para TRITURADORA
          const pesoPalet = pesoReal
          const pesoTriturado = pesoPalet - (Math.random() * 3) // Hasta 3 kg menos
          const diferenciaTrit = pesoPalet - pesoTriturado
          const estadoTrit = diferenciaTrit <= 2 ? 'ok' : 'error'
          
          paletes.push({
            numero: p,
            pesoReal,
            pesoEstimado,
            pesoTolerado,
            estado: estadoPaletes
          })
          
          trituradora.push({
            numero: p,
            pesoPalet,
            pesoTriturado: Math.round(pesoTriturado * 10) / 10,
            diferencia: Math.round(diferenciaTrit * 10) / 10,
            estado: estadoTrit
          })
        }
        
        data.push({
          placa: `PCO-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          pesoAntes,
          pesoDespues,
          diferencia,
          horaIngreso: hora,
          fecha: fecha.toISOString().slice(0, 10),
          paletes,
          trituradora
        })
        camionId++
      }
    }
    
    return data
  }, [range])

  const exportPNG = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'tablero.png'
    link.click()
  }

  const exportPDF = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current)
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('tablero.pdf')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <DateRange from={range.from} to={range.to} onChange={setRange} />
      </div>

      <section className="flex items-center gap-2">
        <button onClick={exportPNG} className="btn btn-ghost">Exportar PNG</button>
        <button onClick={exportPDF} className="btn btn-ghost">Exportar PDF</button>
        <button onClick={exportExcel} className="btn btn-ghost">Exportar Excel</button>
      </section>

      <section ref={ref} className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Tendencia de pesajes por día</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#F15A29" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="report-sabanas bg-white/5 border border-white/10 rounded p-4">
        <div className="flex items-end gap-3 mb-4">
          <h2 className="font-semibold flex-1">Sábanas de pesajes</h2>
          <DateRange from={range.from} to={range.to} onChange={setRange} />
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3 text-left border-r border-white/10">CAMIÓN</th>
                <th className="p-3 text-left border-r border-white/10">PALETES</th>
                <th className="p-3 text-left">TRITURADORA</th>
              </tr>
            </thead>
            <tbody>
              {sabanasData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-white/60">
                    No hay datos para el rango de fechas seleccionado
                  </td>
                </tr>
              ) : (
                sabanasData.map((camion, idx) => (
                  <tr key={idx} className="border-b border-white/10">
                    <td className="p-4 border-r border-white/10 align-top">
                      <div className="space-y-2">
                        <div><strong>Placa:</strong> {camion.placa}</div>
                        <div><strong>Peso antes:</strong> {camion.pesoAntes.toLocaleString('es-CO')} kg</div>
                        <div><strong>Peso después:</strong> {camion.pesoDespues.toLocaleString('es-CO')} kg</div>
                        <div><strong>Diferencia:</strong> {camion.diferencia.toLocaleString('es-CO')} kg</div>
                        <div><strong>Hora de ingreso:</strong> {camion.horaIngreso}</div>
                        <div className="text-xs text-white/60 mt-2">Fecha: {new Date(camion.fecha).toLocaleDateString('es-CO')}</div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-white/10 align-top">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="p-2 text-left border-r border-white/10">Palet</th>
                              <th className="p-2 text-left border-r border-white/10">Peso real (kg)</th>
                              <th className="p-2 text-left border-r border-white/10">Peso estimado (kg)</th>
                              <th className="p-2 text-left border-r border-white/10">Peso tolerado (kg)</th>
                              <th className="p-2 text-center border-r border-white/10">Estado</th>
                              <th className="p-2 text-center">Ver más</th>
                            </tr>
                          </thead>
                          <tbody>
                            {camion.paletes.map((palet, pIdx) => (
                              <tr key={pIdx} className={pIdx < camion.paletes.length - 1 ? 'border-b border-white/5' : ''}>
                                <td className="p-2 border-r border-white/10">Palet {palet.numero}</td>
                                <td className="p-2 border-r border-white/10">{palet.pesoReal}</td>
                                <td className="p-2 border-r border-white/10">{palet.pesoEstimado}</td>
                                <td className="p-2 border-r border-white/10">{palet.pesoTolerado} kg</td>
                                <td className="p-2 text-center border-r border-white/10">
                                  <span className={palet.estado === 'ok' ? 'text-green-500' : 'text-red-500'}>
                                    {palet.estado === 'ok' ? '✔' : '✖'}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  <button className="text-xs btn btn-ghost px-2 py-1">Ver más</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="p-2 text-left border-r border-white/10">Palet</th>
                              <th className="p-2 text-left border-r border-white/10">Peso palet (kg)</th>
                              <th className="p-2 text-left border-r border-white/10">Peso triturado (kg)</th>
                              <th className="p-2 text-left border-r border-white/10">Diferencia (kg)</th>
                              <th className="p-2 text-center border-r border-white/10">Estado</th>
                              <th className="p-2 text-center">Ver más</th>
                            </tr>
                          </thead>
                          <tbody>
                            {camion.trituradora.map((trit, tIdx) => (
                              <tr key={tIdx} className={tIdx < camion.trituradora.length - 1 ? 'border-b border-white/5' : ''}>
                                <td className="p-2 border-r border-white/10">Palet {trit.numero}</td>
                                <td className="p-2 border-r border-white/10">{trit.pesoPalet}</td>
                                <td className="p-2 border-r border-white/10">{trit.pesoTriturado.toFixed(1)}</td>
                                <td className="p-2 border-r border-white/10">{trit.diferencia.toFixed(1)} kg</td>
                                <td className="p-2 text-center border-r border-white/10">
                                  <span className={trit.estado === 'ok' ? 'text-green-500' : 'text-red-500'}>
                                    {trit.estado === 'ok' ? '✔' : '✖'}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  <button className="text-xs btn btn-ghost px-2 py-1">Ver más</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Desviación por modelo (promedio)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deviationByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="#F15A29" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}


