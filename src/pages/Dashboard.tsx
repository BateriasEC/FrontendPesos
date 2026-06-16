import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { api } from '../services/api'
import HistorialAlertas from '../components/HistorialAlertas'

type Weighing = {
  id: number
  fecha: string
  variacion: number
}

type DashboardStats = {
  vehiclesInPlant: number
  weighingsToday: number
  avgVariation: number
  recepcionesHoy: number
  avgRecepcionDiff: number
  alerts: number
  weighingsLast24h: Array<{ fecha: string; variacion: number }>
  recepcionesLast24h: Array<{ fecha: string; diferencia: number }>
}

type BalanzaInfo = {
  operacionesHoy?: number
  kilosHoy?: number
  lastUpdate?: string | null
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0)
  const [balanzas, setBalanzas] =
    useState<Map<number, BalanzaInfo>>(new Map())

  const [stats, setStats] = useState<DashboardStats>({
    vehiclesInPlant: 0,
    weighingsToday: 0,
    avgVariation: 0,
    recepcionesHoy: 0,
    avgRecepcionDiff: 0,
    alerts: 0,
    weighingsLast24h: [],
    recepcionesLast24h: [],
  })

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/stats')
      const data = res.data?.data || res.data || {}

      setStats({
        vehiclesInPlant: data.vehiclesInPlant || 0,
        weighingsToday: data.weighingsToday || 0,
        avgVariation: Number(data.avgVariation || 0),
        recepcionesHoy: data.recepcionesHoy || 0,
        avgRecepcionDiff: Number(data.avgRecepcionDiff || 0),
        alerts: data.alerts || 0,
        weighingsLast24h: data.weighingsLast24h || [],
        recepcionesLast24h: data.recepcionesLast24h || [],
      })

      setWeighings(
        (data.weighingsLast24h || []).map((w: any, i: number) => ({
          id: i + 1,
          fecha: w.fecha || w.updatedAt,
          variacion: Number(w.variacion || 0)
        }))
      )
    } catch (e) {
      console.error('Error dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadBalanzas = async () => {
    try {
      const res = await api.get('/dashboard/scale-stats')
      const data = res.data?.data || res.data || {}
      const map = new Map<number, BalanzaInfo>()

      if (data.scale1) {
        map.set(1, {
          operacionesHoy: data.scale1.operacionesHoy || 0,
          kilosHoy: data.scale1.kilosHoy || 0,
          lastUpdate: data.scale1.lastUpdate || null
        })
      }
      if (data.scale2) {
        map.set(2, {
          operacionesHoy: data.scale2.operacionesHoy || 0,
          kilosHoy: data.scale2.kilosHoy || 0,
          lastUpdate: data.scale2.lastUpdate || null
        })
      }
      if (data.scale3) {
        map.set(3, {
          operacionesHoy: data.scale3.operacionesHoy || 0,
          kilosHoy: data.scale3.kilosHoy || 0,
          lastUpdate: data.scale3.lastUpdate || null
        })
      }

      setBalanzas(map)
    } catch (e) {
      console.error('Error balanzas:', e)
    }
  }

  useEffect(() => {
    loadStats()
    loadBalanzas()
    // Polling automático removido - solo se actualiza al cargar la página o al recargar manualmente
  }, [])

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.all([loadStats(), loadBalanzas()])
      // Forzar recarga del Historial de Alertas cambiando la key.
      setAlertsRefreshKey((k) => k + 1)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DASHBOARD GENERAL</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 text-sm rounded-lg bg-brand-orange hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          title="Actualizar datos"
        >
          {refreshing && (
            <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {refreshing ? 'Actualizando...' : 'Actualizar Dashboard'}
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Vehículos en planta" value={stats.vehiclesInPlant} />
        <StatCard title="Pesajes hoy" value={stats.weighingsToday} />
        <StatCard title="Recepciones hoy" value={stats.recepcionesHoy} />
        <StatCard title="Variación promedio" value={`${Number(stats.avgVariation).toFixed(2)} kg`} />
        <StatCard title="Dif. recepción prom." value={`${Number(stats.avgRecepcionDiff).toFixed(2)} kg`} />
        <StatCard title="Alertas" value={stats.alerts} />
      </div>

      {/* Producción de Pesajes */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-lg">
          Producción de Pesajes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => {
            const b = balanzas.get(i)
            const sectionName = i === 1 ? 'Pesaje de Vehículos' : i === 2 ? 'Pesaje de Pallets' : 'Despacho'

            return (
              <div
                key={i}
                className="rounded-lg p-4 bg-black/30 border border-white/10"
              >
                <div className="text-sm font-semibold mb-2">
                  {sectionName}
                </div>

                {i !== 3 ? (
                  <>
                    <div className="text-sm text-gray-300">
                      Pesajes totales
                    </div>
                    <div className="text-xl font-bold">
                      {b?.operacionesHoy || 0}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Total procesado
                    </div>
                    <div className="text-sm">
                      {(b?.kilosHoy || 0).toLocaleString()} kg
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-300">
                      Despachos totales
                    </div>
                    <div className="text-xl font-bold">
                      {b?.operacionesHoy || 0}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Kg despachados
                    </div>
                    <div className="text-sm">
                      {(b?.kilosHoy || 0).toLocaleString()} kg
                    </div>
                  </>
                )}

                {b?.lastUpdate && (
                  <div className="text-[10px] text-gray-500 mt-2">
                    Última actualización:{' '}
                    {new Date(b.lastUpdate).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Gráfica */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-lg">
          Variaciones últimas 24 horas
        </h2>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Cargando datos...
          </div>
        ) : weighings.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Sin datos registrados
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weighings.slice(-20)}>
                <CartesianGrid stroke="#ffffff22" strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                  tick={{ fill: '#D1D5DB', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#D1D5DB', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(value ?? 0)
                    return [`${numericValue.toFixed(2)} kg`, 'Variación']
                  }}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="variacion"
                  stroke="#F15A29"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Historial de Alertas */}
      <HistorialAlertas refreshKey={alertsRefreshKey} />
    </div>
  )
}

function StatCard({
  title,
  value
}: {
  title: string
  value: number | string
}) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="mt-3 h-1 w-full bg-brand-orange rounded-full" />
    </div>
  )
}
