import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, LineChart, Line } from 'recharts'

type ChartData = Array<{ day: string; total: number }>
type DeviationData = Array<{ product: string; avg: number }>

type ReportChartsProps = {
  byDay: ChartData
  deviationByProduct: DeviationData
}

export function ReportCharts({ byDay, deviationByProduct }: ReportChartsProps) {
  return (
    <>
      <section className="bg-white/5 border border-white/10 rounded p-4">
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
    </>
  )
}

