import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, LineChart, Line } from 'recharts'

type ChartData = Array<{ day: string; total: number }>
type DeviationData = Array<{ product: string; avg: number }>

type ReportChartsProps = {
  byDay: ChartData
  deviationByProduct: DeviationData
  loading?: boolean
}

export function ReportCharts({ byDay, deviationByProduct, loading = false }: ReportChartsProps) {
  if (loading) {
    return (
      <>
        <section className="bg-white/5 border border-white/10 rounded p-4">
          <h2 className="font-semibold mb-2">Tendencia de pesajes por día</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-white/60">Cargando datos...</p>
            </div>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded p-4">
          <h2 className="font-semibold mb-2">Desviación por modelo (promedio)</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-white/60">Cargando datos...</p>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Tendencia de pesajes por día</h2>
        <div className="h-64">
          {byDay.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/60">No hay datos para mostrar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#ffffff88' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('es-CO', { 
                      month: '2-digit', 
                      day: '2-digit',
                      timeZone: 'America/Bogota'
                    })
                  }}
                />
                <YAxis tick={{ fill: '#ffffff88' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #ffffff22',
                    borderRadius: '4px',
                    color: '#ffffff'
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('es-CO', { 
                      year: 'numeric',
                      month: '2-digit', 
                      day: '2-digit',
                      timeZone: 'America/Bogota'
                    })
                  }}
                />
                <Bar dataKey="total" fill="#F15A29" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded p-4">
        <h2 className="font-semibold mb-2">Desviación por modelo (promedio)</h2>
        <div className="h-64">
          {deviationByProduct.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/60">No hay datos para mostrar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deviationByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis 
                  dataKey="product" 
                  tick={{ fill: '#ffffff88' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#ffffff88' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #ffffff22',
                    borderRadius: '4px',
                    color: '#ffffff'
                  }}
                />
                <Line type="monotone" dataKey="avg" stroke="#F15A29" dot={{ fill: '#F15A29' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  )
}

