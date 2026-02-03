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

type BalanzaEstado = 'ONLINE' | 'IDLE' | 'OFFLINE'

type BalanzaInfo = {
  estado: BalanzaEstado
  peso: number
  unidad: string
  lastUpdate: string | null
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState<number | ''>('')
  const [balanzasEstados, setBalanzasEstados] = useState<Map<number, BalanzaInfo>>(new Map())
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
        const response = await api.get('/dashboard/stats')
        const data = response.data?.data || response.data || {}

        setStats({
          vehiclesInPlant: data.vehiclesInPlant || 0,
          weighingsToday: data.weighingsToday || 0,
          avgVariation: parseFloat(Number(data.avgVariation || 0).toFixed(2)),
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
      } catch (error) {
        console.error('Error cargando dashboard:', error)
        setWeighings([])
      } finally {
        setLoading(false)
      }
    }

    const loadBalanzasEstados = async () => {
      try {
        const response = await api.get('/balanzas/estados')
        const estados = response.data || {}
        const estadosMap = new Map<number, BalanzaInfo>()
        
        Object.keys(estados).forEach((key) => {
          const balanzaId = parseInt(key)
          estadosMap.set(balanzaId, estados[balanzaId])
        })
        
        setBalanzasEstados(estadosMap)
      } catch (error) {
        console.error('Error cargando estados de balanzas:', error)
      }
    }

    loadStats()
    loadBalanzasEstados()
    
    // Actualizar estados de balanzas cada 5 segundos
    const interval = setInterval(loadBalanzasEstados, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">DASHBOARD GENERAL</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <StatCard title="Vehículos en planta" value={stats.vehiclesInPlant} />
        <StatCard title="Pesajes hoy" value={stats.weighingsToday} />
        <StatCard title="Variación promedio" value={`${stats.avgVariation} kg`} />
        <StatCard title="Alertas" value={stats.alerts} />

        {/* Umbral */}
        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-sm hover:shadow-md transition">
          <div className="text-sm text-gray-300 mb-2">
            Umbral de alerta
          </div>

          <div className="relative">
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) =>
                setThreshold(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="Ej: 50 kg"
              className="
                w-full rounded-lg px-3 py-2
                bg-black/30
                border border-white/10
                text-gray-100
                placeholder:text-gray-500
                focus:outline-none
                focus:ring-1 focus:ring-brand-orange/60
                focus:border-brand-orange/60
                transition
              "
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              kg
            </span>
          </div>

          {threshold !== '' && (
            <div className="mt-2 text-xs text-gray-400">
              Alertas sobre{' '}
              <span className="text-brand-orange font-medium">
                {threshold} kg
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Básculas */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-lg">
          Estado de Básculas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => {
            const balanzaInfo = balanzasEstados.get(i)
            const estado = balanzaInfo?.estado || 'OFFLINE'
            const peso = balanzaInfo?.peso || 0
            const unidad = balanzaInfo?.unidad || 'kg'
            const lastUpdate = balanzaInfo?.lastUpdate
            
            const getEstadoColor = (estado: BalanzaEstado) => {
              switch (estado) {
                case 'ONLINE':
                  return 'bg-green-400'
                case 'IDLE':
                  return 'bg-yellow-400'
                case 'OFFLINE':
                  return 'bg-red-400'
                default:
                  return 'bg-gray-400'
              }
            }

            const getEstadoLabel = (estado: BalanzaEstado) => {
              switch (estado) {
                case 'ONLINE':
                  return 'En línea'
                case 'IDLE':
                  return 'Inactiva'
                case 'OFFLINE':
                  return 'Desconectada'
                default:
                  return 'Desconocido'
              }
            }

            return (
              <div
                key={i}
                className="rounded-lg p-4 bg-black/30 border border-white/10 hover:bg-black/40 transition"
              >
                <div className="text-sm font-medium mb-2">Báscula {i}</div>
                <div className="mt-2 flex items-center gap-2 text-sm mb-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getEstadoColor(estado)}`}
                  />
                  {getEstadoLabel(estado)}
                </div>
                {peso > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Último peso: {peso.toLocaleString()} {unidad}
                  </div>
                )}
                {lastUpdate && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(lastUpdate).toLocaleTimeString()}
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
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-brand-orange rounded-full mx-auto mb-2" />
              Cargando datos...
            </div>
          </div>
        ) : weighings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="text-lg mb-2">📉</div>
            <p className="text-sm">
              No se registraron variaciones en las últimas 24 horas
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Las básculas no reportaron cambios de peso
            </p>
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
                  labelFormatter={(v) =>
                    new Date(v as string).toLocaleString()
                  }
                  formatter={(value: number) => [
                    `${value.toFixed(2)} kg`,
                    'Variación'
                  ]}
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
    <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-sm hover:shadow-md transition">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="mt-3 h-1 w-full bg-brand-orange/70 rounded-full" />
    </div>
  )
}
