import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid
} from 'recharts'

type ChartData = Array<{ day: string; total: number; peso: number }>
type DeviationData = Array<{
  product: string
  avg: number
  registros?: number
}>

type ReportChartsProps = {
  byDay: ChartData
  deviationByProduct: DeviationData
  loading?: boolean
}

export function ReportCharts({
  byDay,
  deviationByProduct,
  loading = false
}: ReportChartsProps) {
  // Resumen de estado de pallets
  const estadoPallets = [
    {
      label: 'Despachados',
      total: deviationByProduct.reduce((sum, p) => sum + (p.despachados || 0), 0),
      color: '#10B981'
    },
    {
      label: 'Pendientes',
      total: deviationByProduct.reduce((sum, p) => sum + (p.pendientes || 0), 0),
      color: '#FDB71A'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ================= PESO TOTAL POR DÍA ================= */}
      <section className="rounded-xl border border-white/10 bg-neutral-800/40 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">
          Peso Total Procesado por Día
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Peso total de pallets procesados diariamente (en kilogramos)
        </p>

        <div className="h-64">
          {loading ? (
            <Loading />
          ) : byDay.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value: string) => {
                    const [, month, day] = value.split('-')
                    return `${day}/${month}`
                  }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                  label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const [y, m, d] = data.day.split('-');
                      return (
                        <div style={{
                          backgroundColor: '#262626',
                          border: '1px solid #ffffff14',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: 12
                        }}>
                          <p style={{ margin: 0, marginBottom: 4, fontWeight: 'bold' }}>
                            Fecha: {d}/{m}/{y}
                          </p>
                          <p style={{ margin: 0, color: '#F15A29' }}>
                            Vehículos: {data.total}
                          </p>
                          <p style={{ margin: 0, color: '#FDB71A' }}>
                            Pallets: {data.pallets}
                          </p>
                          <p style={{ margin: 0, color: '#10B981', fontWeight: 'bold', fontSize: 14 }}>
                            Peso Pallets: {data.peso.toLocaleString()} kg
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="peso"
                  fill="#F15A29"
                  radius={[6, 6, 0, 0]}
                  name="Peso Total (kg)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ================= ESTADO DE PALLETS ================= */}
      <section className="rounded-xl border border-white/10 bg-neutral-800/40 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">
          Estado de Pallets
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Cantidad de pallets despachados vs pendientes de despacho
        </p>

        <div className="h-64">
          {loading ? (
            <Loading />
          ) : estadoPallets.every(d => d.total === 0) ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estadoPallets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                  label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const totalPallets = estadoPallets.reduce((sum, p) => sum + p.total, 0);
                      const porcentaje = totalPallets > 0 ? ((data.total / totalPallets) * 100).toFixed(1) : '0';
                      return (
                        <div style={{
                          backgroundColor: '#262626',
                          border: '1px solid #ffffff14',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: 12
                        }}>
                          <p style={{ margin: 0, marginBottom: 4, fontWeight: 'bold' }}>
                            {data.label}
                          </p>
                          <p style={{ margin: 0, color: data.color, fontSize: 14, fontWeight: 'bold' }}>
                            {data.total} pallets
                          </p>
                          <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>
                            {porcentaje}% del total
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                >
                  {estadoPallets.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="total" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}

/* ================= helpers ================= */

function Loading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" />
        <p className="text-xs text-gray-400">Cargando datos…</p>
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-gray-400">No hay datos para mostrar</p>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#262626',
  border: '1px solid #ffffff14',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12
}
