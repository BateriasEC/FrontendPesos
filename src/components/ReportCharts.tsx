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
  const deviationSummary = [
    {
      label: 'Baja (≤ 0.5 kg)',
      total: deviationByProduct.filter(d => d.avg <= 0.5).length
    },
    {
      label: 'Media (0.5 – 1 kg)',
      total: deviationByProduct.filter(
        d => d.avg > 0.5 && d.avg <= 1
      ).length
    },
    {
      label: 'Alta (> 1 kg)',
      total: deviationByProduct.filter(d => d.avg > 1).length
    }
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ================= PESAJES POR DÍA ================= */}
      <section className="rounded-xl border border-white/10 bg-neutral-800/40 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">
          Cantidad de pesajes por día
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Total de registros diarios según el rango seleccionado
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
                            Pesajes: {data.total}
                          </p>
                          <p style={{ margin: 0, color: '#F15A29', fontWeight: 'bold' }}>
                            Peso Total: {data.peso.toLocaleString()} kg
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#F15A29"
                  radius={[6, 6, 0, 0]}
                  name="Pesajes"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ================= DESVIACIÓN GENERAL ================= */}
      <section className="rounded-xl border border-white/10 bg-neutral-800/40 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">
          Distribución de desviación promedio
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Clasificación general de desviaciones por rango de peso
        </p>

        <div className="h-64">
          {loading ? (
            <Loading />
          ) : deviationSummary.every(d => d.total === 0) ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}`, 'Modelos']}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="total"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
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
