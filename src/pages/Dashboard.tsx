import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'

type Weighing = {
  id: number
  fecha: string
  variacion: number
}

export default function Dashboard() {
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(50)

  // Simulación local: genera datos para tarjetas y gráfica
  useEffect(() => {
    const now = new Date()
    const items: Weighing[] = []
    // últimos 24 puntos (cada 30 min aprox.)
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 30 * 60 * 1000)
      const variacion = Math.round((Math.random() * 80 - 40) * 10) / 10 // -40 a 40
      items.push({ id: i + 1, fecha: d.toISOString(), variacion })
    }
    setWeighings(items)
    setLoading(false)
  }, [])

  // Valor quemado (simulado) a pedido: no depende de la API
  // Valores simulados
  const vehiclesInPlant = 3
  const weighingsToday = 2
  const avgVariation = 2.6
  const alerts = 4
  const eficiencia = useMemo(() => [
    { bascula: 'B1', ef: 92 },
    { bascula: 'B2', ef: 87 },
    { bascula: 'B3', ef: 78 },
    { bascula: 'B4', ef: 95 },
  ], [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      <section className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Mapa de básculas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      <section className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Gráfica en vivo</h2>
        {loading ? (
          <div className="text-sm text-gray-400">Cargando…</div>
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
                <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Line type="monotone" dataKey="variacion" stroke="#F15A29" dot={false} />
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


