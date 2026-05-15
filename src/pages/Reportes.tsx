import { useState } from 'react'
import { Pagination } from '../components/Pagination'
import { ReportCharts } from '../components/ReportCharts'
import { api } from '../services/api'
import {
  defaultReportFilters,
  useVehicleReports,
} from '../hooks/useVehicleReports'
import type {
  ReportVehicle,
  VehicleGeneralFilter,
} from '../hooks/useVehicleReports'
import '../styles/report-sabanas.css'

const vehicleFilterOptions: Array<{ value: VehicleGeneralFilter; label: string }> = [
  { value: 'all', label: 'Vehículos totales en general' },
  { value: 'withPendingPallets', label: 'Vehículos con pallets pesados' },
  { value: 'withCompletedPallets', label: 'Vehículos con pallets despachados' },
  { value: 'withoutPallets', label: 'Vehículos sin pallets' },
  { value: 'withExit', label: 'Vehículos solo con registro de salida' },
  { value: 'withEntry', label: 'Vehículos con registro de entrada' },
]

function formatKg(value: number | null | undefined) {
  if (value == null) return 'Pendiente'
  return `${Number(value).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default function Reportes() {
  const initial = defaultReportFilters()
  const { filters, setFilters, data, loading, error, reload } = useVehicleReports(initial)
  const [draft, setDraft] = useState(filters)
  const [downloading, setDownloading] = useState<string | null>(null)

  const applyFilters = () => {
    setFilters({ ...draft, page: 1 })
  }

  const changePage = (page: number) => {
    const next = { ...filters, page }
    setDraft(next)
    setFilters(next)
  }

  const downloadReport = async (kind: 'excel' | 'pdf' | 'general-excel') => {
    setDownloading(kind)
    try {
      const isGeneral = kind === 'general-excel'
      const response = await api.get(
        isGeneral ? '/pallets/reports/export/general-excel' : `/pallets/reports/export/${kind}`,
        {
          responseType: 'blob',
          params: isGeneral
            ? undefined
            : {
                from: filters.from,
                to: filters.to,
                vehicleFilter: filters.vehicleFilter,
                placa: filters.placa || undefined,
              },
        },
      )

      const today = new Date().toISOString().slice(0, 10)
      const extension = kind === 'pdf' ? 'pdf' : 'xlsx'
      const fileName = isGeneral
        ? `reporte_general_${today}.xlsx`
        : `reporte_filtrado_${filters.from}_${filters.to}.${extension}`
      downloadBlob(response.data, fileName)
    } catch (err) {
      console.error('Error descargando reporte:', err)
      alert('No se pudo descargar el reporte.')
    } finally {
      setDownloading(null)
    }
  }

  const vehicles = data?.vehicles ?? []
  const pagination = data?.pagination ?? { page: 1, limit: filters.limit, total: 0, totalPages: 1 }

  return (
    <div className="report-sabanas space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>
        <p className="text-sm text-gray-400">
          Consulta consolidada de vehículos, pallets y despachos con datos actualizados desde la base.
        </p>
      </header>

      <section className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-neutral-900/95 p-4 shadow-xl backdrop-blur">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[repeat(2,minmax(140px,1fr))_120px_minmax(280px,1.4fr)_minmax(180px,1fr)_auto] xl:items-end">
          <label className="space-y-1 text-xs font-semibold text-gray-300">
            Desde
            <input
              type="date"
              className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-neutral-900"
              value={draft.from}
              onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-gray-300">
            Hasta
            <input
              type="date"
              className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-neutral-900"
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
            />
          </label>

          <button
            className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500 disabled:opacity-60"
            onClick={applyFilters}
            disabled={loading}
          >
            Buscar
          </button>

          <label className="space-y-1 text-xs font-semibold text-gray-300">
            Filtro general
            <select
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
              value={draft.vehicleFilter}
              onChange={(event) =>
                setDraft((current) => ({ ...current, vehicleFilter: event.target.value as VehicleGeneralFilter }))
              }
            >
              {vehicleFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold text-gray-300">
            Placa
            <input
              type="search"
              placeholder="Buscar placa..."
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
              value={draft.placa}
              onChange={(event) => setDraft((current) => ({ ...current, placa: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters()
              }}
            />
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-36 xl:grid-cols-1 xl:justify-self-end">
            <button
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-emerald-500 disabled:opacity-60"
              onClick={() => void downloadReport('excel')}
              disabled={downloading !== null}
              title="Exportar Excel filtrado"
            >
              Excel
            </button>
            <button
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-red-500 disabled:opacity-60"
              onClick={() => void downloadReport('pdf')}
              disabled={downloading !== null}
              title="Exportar PDF filtrado"
            >
              PDF
            </button>
            <button
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-orange px-3 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:brightness-110 disabled:opacity-60"
              onClick={() => void downloadReport('general-excel')}
              disabled={downloading !== null}
              title="Reporte general Excel sin filtros"
            >
              Reporte general
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}{' '}
          <button className="font-semibold underline" onClick={() => void reload()}>
            Reintentar
          </button>
        </div>
      )}

      <ReportCharts
        byDay={data?.charts.byDay ?? []}
        deviationByProduct={data?.charts.deviationByProduct ?? []}
        loading={loading}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Etiquetas de vehículos</h2>
            <p className="text-sm text-gray-400">
              {pagination.total} vehículo(s) encontrados. Página {pagination.page} de {pagination.totalPages}.
            </p>
          </div>
          <Pagination
            page={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={changePage}
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
            Cargando reportes...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
            No hay vehículos para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-5">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function VehicleCard({ vehicle }: { vehicle: ReportVehicle }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
      <header className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-100">
            {vehicle.tipoVehiculo || 'Vehículo'} #{vehicle.numero}
          </h3>
          <p className="text-sm text-gray-400">
            {vehicle.placa} · {vehicle.cliente} · {vehicle.producto}
          </p>
          <p className="text-xs text-gray-500">Trazabilidad: {vehicle.codigoTrazabilidad}</p>
          <p className="text-xs text-gray-500">Operador: {vehicle.operador}</p>
        </div>
        <div className="text-left text-xs text-gray-400 sm:text-right">
          <div>{vehicle.fechaRegistro}</div>
          <div>{vehicle.horaRegistro}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-white/10 xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <section className="space-y-3 p-4">
          <h4 className="text-xs uppercase tracking-wide text-gray-300">Pesaje del Vehículo</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Metric label="Peso Ingreso" value={formatKg(vehicle.pesoIngreso)} />
            <Metric label="Peso Salida" value={vehicle.pesoSalida > 0 ? formatKg(vehicle.pesoSalida) : 'Pendiente'} />
            <Metric label="Diferencia" value={formatKg(vehicle.diferencia)} />
          </div>
          <Metric label="Peso Total Pallets" value={formatKg(vehicle.pesoTotalPallets)} strong />

          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <SummaryMetric label="Total pallets registrados" value={vehicle.resumen.totalPalletsRegistrados} />
            <SummaryMetric
              label="Pallets sin despachar"
              value={`${vehicle.resumen.palletsSinDespachar} · ${formatKg(vehicle.resumen.pesoSinDespachar)}`}
            />
            <SummaryMetric
              label="Pallets despachados"
              value={`${vehicle.resumen.palletsDespachados} · ${formatKg(vehicle.resumen.pesoDespachado)}`}
            />
          </div>
        </section>

        <section className="p-4">
          <h4 className="mb-3 text-xs uppercase tracking-wide text-gray-300">Pallets del vehículo</h4>
          {vehicle.pallets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-neutral-800/40 p-6 text-center text-sm text-gray-400">
              No hay pallets registrados para este vehículo todavía.
            </div>
          ) : (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {vehicle.pallets.map((pallet) => (
                <div
                  key={pallet.id}
                  className="rounded-lg border border-white/10 bg-neutral-800/40 p-3 transition hover:border-white/20"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-brand-orange">{pallet.codigo}</div>
                      <div className="text-xs text-gray-400">{pallet.producto}</div>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${
                        pallet.estado === 'completado'
                          ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {pallet.estado === 'completado' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                    <PalletMetric label="Inicial" value={formatKg(pallet.pesoInicial)} />
                    <PalletMetric label="Despacho" value={formatKg(pallet.pesoDespacho)} />
                    <PalletMetric label="Diferencia" value={formatKg(pallet.diferencia)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </article>
  )
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-800/40 p-3">
      <span className="text-xs text-gray-400">{label}</span>
      <div className={strong ? 'text-base font-bold text-gray-100' : 'text-sm font-semibold text-gray-200'}>
        {value}
      </div>
    </div>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-200">{value}</div>
    </div>
  )
}

function PalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>
      <div className="font-medium">{value}</div>
    </div>
  )
}

