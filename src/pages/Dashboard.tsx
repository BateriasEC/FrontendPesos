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

type Producto = {
  id: string
  codigo: string
  nombre: string
}

type CanalVehiculo = {
  id: string
  codigo: string
  nombre: string
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0)
  const [balanzas, setBalanzas] =
    useState<Map<number, BalanzaInfo>>(new Map())

  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [products, setProducts] = useState<Producto[]>([])
  const [channels, setChannels] = useState<CanalVehiculo[]>([])

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

  const loadFiltersData = async () => {
    try {
      const [prodRes, chanRes] = await Promise.all([
        api.get('/products', { params: { page: 1, limit: 100 } }),
        api.get('/canales-vehiculo', { params: { page: 1, limit: 100 } }),
      ])
      
      const prodData = prodRes.data?.data ?? prodRes.data
      const chanData = chanRes.data?.data ?? chanRes.data
      
      const prodArray = Array.isArray(prodData) ? prodData : (prodData?.data || [])
      const chanArray = Array.isArray(chanData) ? chanData : (chanData?.data || [])
      
      setProducts(prodArray)
      setChannels(chanArray)
    } catch (e) {
      console.error('Error al cargar datos de filtros:', e)
    }
  }

  const loadStats = async (productId?: string, canalVehiculoId?: string) => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/stats', {
        params: {
          productId: productId || undefined,
          canalVehiculoId: canalVehiculoId || undefined,
        }
      })
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

  const loadBalanzas = async (productId?: string, canalVehiculoId?: string) => {
    try {
      const res = await api.get('/dashboard/scale-stats', {
        params: {
          productId: productId || undefined,
          canalVehiculoId: canalVehiculoId || undefined,
        }
      })
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
    loadFiltersData()
  }, [])

  useEffect(() => {
    loadStats(selectedProduct, selectedChannel)
    loadBalanzas(selectedProduct, selectedChannel)
  }, [selectedProduct, selectedChannel])

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.all([
        loadStats(selectedProduct, selectedChannel),
        loadBalanzas(selectedProduct, selectedChannel)
      ])
      // Forzar recarga del Historial de Alertas cambiando la key.
      setAlertsRefreshKey((k) => k + 1)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">DASHBOARD GENERAL</h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between bg-white/5 border border-white/10 p-4 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* PRODUCT FILTER */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs font-semibold text-gray-400">Producto</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#EE3626] w-full"
            >
              <option value="">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* CHANNEL FILTER */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs font-semibold text-gray-400">Canal de Vehículo</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#EE3626] w-full"
            >
              <option value="">Todos los canales</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-end lg:self-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md h-fit mt-1 sm:mt-0"
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
      <HistorialAlertas
        refreshKey={alertsRefreshKey}
        selectedProduct={selectedProduct}
        selectedChannel={selectedChannel}
      />
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
