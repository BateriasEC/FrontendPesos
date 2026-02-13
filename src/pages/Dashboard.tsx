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

type BalanzaInfo = {
  operacionesHoy?: number
  kilosHoy?: number
  lastUpdate?: string | null
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [balanzas, setBalanzas] =
    useState<Map<number, BalanzaInfo>>(new Map())

  const [stats, setStats] = useState<DashboardStats>({
    vehiclesInPlant: 0,
    weighingsToday: 0,
    avgVariation: 0,
    alerts: 0,
    weighingsLast24h: []
  })

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const res = await api.get('/dashboard/stats')
        const data = res.data?.data || res.data || {}

        setStats({
          vehiclesInPlant: data.vehiclesInPlant || 0,
          weighingsToday: data.weighingsToday || 0,
          avgVariation: Number(data.avgVariation || 0).toFixed(2),
          alerts: data.alerts || 0,
          weighingsLast24h: data.weighingsLast24h || []
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
        const res = await api.get('/balanzas/estados')
        const data = res.data || {}
        const map = new Map<number, BalanzaInfo>()

        Object.keys(data).forEach((k) => {
          map.set(Number(k), data[k])
        })

        setBalanzas(map)
      } catch (e) {
        console.error('Error balanzas:', e)
      }
    }

    loadStats()
    loadBalanzas()

    const interval = setInterval(loadBalanzas, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">DASHBOARD GENERAL</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Vehículos en planta" value={stats.vehiclesInPlant} />
        <StatCard title="Pesajes hoy" value={stats.weighingsToday} />
        <StatCard title="Variación promedio" value={`${stats.avgVariation} kg`} />
        <StatCard title="Alertas" value={stats.alerts} />
      </div>

      {/* Básculas / Despacho */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-lg">
          Producción por báscula
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => {
            const b = balanzas.get(i)

            return (
              <div
                key={i}
                className="rounded-lg p-4 bg-black/30 border border-white/10"
              >
                <div className="text-sm font-semibold mb-2">
                  {i === 3 ? 'Despacho' : `Báscula ${i}`}
                </div>

                {i !== 3 ? (
                  <>
                    <div className="text-sm text-gray-300">
                      Pesajes hoy
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
                      Despachos hoy
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
          <div className="h-64">
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
                <YAxis />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)} kg`, 'Variación']}
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
