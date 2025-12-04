import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { api } from '../services/api'

type Weighing = {
  id: number
  fecha: string
  variacion: number
}

type DashboardStats = {
  vehiclesInPlant: number
  weighingsToday: number
  avgVariation: number
  alerts: number
  weighingsLast24h: Array<{ fecha: string; variacion: number }>
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(50)
  const [stats, setStats] = useState<DashboardStats>({
    vehiclesInPlant: 0,
    weighingsToday: 0,
    avgVariation: 0,
    alerts: 0,
    weighingsLast24h: []
  })

  // Cargar datos reales del backend
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/stats')
        const data = response.data?.data || response.data || {}
        
        setStats({
          vehiclesInPlant: data.vehiclesInPlant || 0,
          weighingsToday: data.weighingsToday || 0,
          avgVariation: Number(data.avgVariation || 0).toFixed(2),
          alerts: data.alerts || 0,
          weighingsLast24h: data.weighingsLast24h || []
        })

        // Mapear datos de las últimas 24h para la gráfica
        const mappedWeighings = (data.weighingsLast24h || []).map((w: any, index: number) => ({
          id: index + 1,
          fecha: w.fecha || w.updatedAt || new Date().toISOString(),
          variacion: Number(w.variacion || w.variacionPeso || 0)
        }))
        
        setWeighings(mappedWeighings)
      } catch (error: any) {
        console.error('Error cargando estadísticas del dashboard:', error)
        // Si falla, usar valores por defecto
        setStats({
          vehiclesInPlant: 0,
          weighingsToday: 0,
          avgVariation: 0,
          alerts: 0,
          weighingsLast24h: []
        })
        setWeighings([])
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // Actualización automática deshabilitada - los datos se cargan solo al entrar
    // Si necesitas actualizar, recarga la página o agrega un botón de refresh
    // Para habilitar auto-refresh, descomenta la siguiente línea:
    // const interval = setInterval(loadStats, 120000) // 2 minutos
    // return () => clearInterval(interval)
  }, [])

  const vehiclesInPlant = stats.vehiclesInPlant
  const weighingsToday = stats.weighingsToday
  const avgVariation = stats.avgVariation
  const alerts = stats.alerts
  const eficiencia = useMemo(() => [
    { bascula: 'B1', ef: 92 },
    { bascula: 'B2', ef: 87 },
    { bascula: 'B3', ef: 78 },
    { bascula: 'B4', ef: 95 },
  ], [])

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card title="Vehículos en planta" value={vehiclesInPlant} />
        <Card title="Pesajes hoy" value={weighingsToday} />
        <Card title="Variación promedio" value={`${avgVariation} kg`} />
        <Card title="Alertas de desviación" value={alerts} />
        <div className="rounded p-4 bg-white/5 border border-white/10 flex flex-col">
          <div className="text-sm text-gray-300 mb-2">Umbral alerta (kg)</div>
          <input
            type="number"
            className="input w-full"
            value={threshold}
            onChange={e=>setThreshold(Number(e.target.value)||0)}
          />
        </div>
      </div>

      <section className="bg-white/5 border border-white/10 rounded p-3 sm:p-4">
        <h2 className="font-semibold mb-2 text-base sm:text-lg">Mapa de básculas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded p-4 bg-black/30 border border-white/10">
              <div className="text-sm">Báscula {i}</div>
              <div className="mt-2 inline-flex items-center gap-2 text-sm">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                {i % 2 === 0 ? 'Activa' : 'Inactiva'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded p-3 sm:p-4">
        <h2 className="font-semibold mb-2 text-base sm:text-lg">Gráfica de Variaciones (Últimas 24h)</h2>
        {loading ? (
          <div className="text-sm text-gray-400 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-2"></div>
              <p>Cargando datos...</p>
            </div>
          </div>
        ) : weighings.length === 0 ? (
          <div className="text-sm text-gray-400 flex items-center justify-center h-64">
            No hay datos de pesajes en las últimas 24 horas
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weighings.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v: string) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  tick={{ fill: '#D1D5DB', fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(v) => new Date(v as string).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Variación']}
                />
                <Line type="monotone" dataKey="variacion" stroke="#F15A29" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Se ocultó la sección de Eficiencia por báscula (simulada) a solicitud del usuario */}

      {/* Mapa de básculas movido arriba; sección original eliminada */}
    </div>
  )
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded p-4 bg-white/5 border border-white/10">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}


