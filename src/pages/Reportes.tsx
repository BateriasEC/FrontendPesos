import { useState } from 'react'
import { Pagination } from '../components/Pagination'
import { ReportCharts } from '../components/ReportCharts'
import { api } from '../services/api'
import { PlacaSearchInput } from '../components/PlacaSearchInput'
import {
  defaultReportFilters,
  useVehicleReports,
} from '../hooks/useVehicleReports'
import type {
  ReportVehicle,
  VehicleGeneralFilter,
} from '../hooks/useVehicleReports'
import {
  formatNullableKg,
  shouldShowPalletOperationDetails,
} from '../utils/palletNeto'
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>
          <p className="text-sm text-gray-400">
            Consulta consolidada de vehículos, pallets y despachos con datos actualizados desde la base.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:mt-1.5">
          <button
            className="flex min-h-10 items-center justify-center rounded-lg bg-neutral-800 border border-white/10 px-4 py-2 text-center text-sm font-semibold leading-tight text-gray-200 transition hover:bg-neutral-700 hover:text-white disabled:opacity-60 shadow-md"
            onClick={() => void reload()}
            disabled={loading}
            title="Refrescar datos de la pantalla"
          >
            <svg className={`mr-1.5 h-4 w-4 shrink-0 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v8" />
            </svg>
            Actualizar
          </button>
          <button
            className="flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-emerald-500 disabled:opacity-60 shadow-md"
            onClick={() => void downloadReport('excel')}
            disabled={downloading !== null}
            title="Exportar Excel filtrado"
          >
            <svg className="mr-1.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            className="flex min-h-10 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-red-500 disabled:opacity-60 shadow-md"
            onClick={() => void downloadReport('pdf')}
            disabled={downloading !== null}
            title="Exportar PDF filtrado"
          >
            <svg className="mr-1.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <button
            className="flex min-h-10 items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:brightness-110 disabled:opacity-60 shadow-md"
            onClick={() => void downloadReport('general-excel')}
            disabled={downloading !== null}
            title="Reporte general Excel sin filtros"
          >
            <svg className="mr-1.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reporte general
          </button>
        </div>
      </header>

      <section className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-neutral-900/95 p-4 shadow-xl backdrop-blur">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[repeat(2,minmax(140px,1fr))_120px_minmax(280px,1.4fr)_minmax(180px,1fr)] xl:items-end">
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
            <PlacaSearchInput
              value={draft.placa || ''}
              onChange={(placa) => setDraft((current) => ({ ...current, placa }))}
              placeholder="Buscar placa..."
              inPlant={false}
            />
          </label>
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

function getWeighingDetails(vehicle: ReportVehicle) {
  // Use fields calculated in the backend, falling back to local calculations if not present
  const opCodigo = (vehicle.codigoTipoOperacion || '').trim().toUpperCase()
  
  let tipoPesaje: 'con_pallet' | 'sin_pallet' | 'mixto' = vehicle.tipoPesaje || 'con_pallet'
  if (!vehicle.tipoPesaje) {
    if (opCodigo === 'RECEPCION_SIN_PALLET') {
      tipoPesaje = 'sin_pallet'
    } else if (opCodigo === 'RECEPCION_MIXTO') {
      tipoPesaje = 'mixto'
    }
  }

  const pesoIngreso = vehicle.pesoIngreso || 0
  const pesoSalida = vehicle.pesoSalida || 0
  const diferencia = Number((pesoIngreso - pesoSalida).toFixed(2))

  const cantidadPallets = vehicle.cantidadPallets ?? vehicle.resumen?.totalPalletsRegistrados ?? vehicle.pallets?.length ?? 0
  const pesoPalletsPromedio = vehicle.pesoPalletsPromedio ?? (cantidadPallets * 25)

  const basePesoTotalPallets = vehicle.pesoTotalPallets || 0

  const pesoTotalPalletsCalculado = vehicle.pesoTotalPalletsCalculado ?? basePesoTotalPallets
  let pesoNetoProductos = vehicle.pesoNetoProductos

  if (pesoNetoProductos == null) {
    if (tipoPesaje === 'con_pallet' || tipoPesaje === 'sin_pallet') {
      pesoNetoProductos = Number((basePesoTotalPallets - pesoPalletsPromedio).toFixed(2))
    } else if (tipoPesaje === 'mixto') {
      let sumNet = 0
      const palletsList = vehicle.pallets || []
      palletsList.forEach((p: any) => {
        const pesoInicial = Number(p.pesoInicial ?? p.pesoTotal ?? p.peso ?? 0)
        const pesoPalletAplicado = p.pesoPalletAplicado != null ? Number(p.pesoPalletAplicado) : 0
        const conPallet = p.productoConPallet !== false
        if (conPallet) {
          sumNet += pesoInicial
        } else {
          sumNet += (pesoInicial - pesoPalletAplicado)
        }
      })
      pesoNetoProductos = Number(sumNet.toFixed(2))
    } else {
      pesoNetoProductos = Number((basePesoTotalPallets - pesoPalletsPromedio).toFixed(2))
    }
  }

  let cantidadPalletsConPallet = 0
  if (tipoPesaje === 'con_pallet') {
    cantidadPalletsConPallet = cantidadPallets
  } else if (tipoPesaje === 'mixto') {
    const palletsList = vehicle.pallets || []
    cantidadPalletsConPallet = palletsList.filter((p: any) => p.productoConPallet !== false).length
  }
  const pesoWoodLeftInPlant = cantidadPalletsConPallet * 25
  const diferenciaNeta = vehicle.diferenciaNeta ?? Number((diferencia - pesoNetoProductos - pesoWoodLeftInPlant).toFixed(2))

  return {
    tipoPesaje,
    pesoIngreso,
    pesoSalida,
    diferencia,
    diferenciaNeta,
    pesoTotalPalletsCalculado,
    cantidadPallets,
    pesoPalletsPromedio,
    pesoNetoProductos,
  }
}

function VehicleCard({ vehicle }: { vehicle: ReportVehicle }) {
  const details = getWeighingDetails(vehicle)
  const hasExit = vehicle.pesoSalida > 0

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
          <p className="text-xs text-gray-500">
            Tipo operación: {vehicle.tipoOperacion || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            Canal: {vehicle.canalVehiculo || 'N/A'}
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
        <section className="space-y-4 p-4">
          <h4 className="text-xs uppercase tracking-wide text-gray-300">Pesaje del Vehículo</h4>
          
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/40 p-1">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                {/* Title Row */}
                <tr>
                  <th colSpan={4} className="border-b border-white/10 bg-white/5 py-2.5 font-bold text-gray-200">
                    {details.tipoPesaje === 'con_pallet' && (
                      <span>Pesaje del Vehículo <span className="text-[#EE3626] font-extrabold">con Pallet</span></span>
                    )}
                    {details.tipoPesaje === 'sin_pallet' && (
                      <span>Pesaje del Vehículo <span className="text-[#EE3626] font-extrabold">Sin Pallet</span></span>
                    )}
                    {details.tipoPesaje === 'mixto' && (
                      <span>Pesaje del Vehículo <span className="text-[#EE3626] font-extrabold">Pallet Mixto</span></span>
                    )}
                  </th>
                </tr>
                {/* Row 1 Headers */}
                <tr className="bg-neutral-800/60 font-semibold text-gray-300">
                  <th className="border-b border-r border-white/10 p-2 text-left">Peso Ingreso</th>
                  <th className="border-b border-r border-white/10 p-2 text-left">Peso Salida</th>
                  <th className="border-b border-r border-white/10 p-2 text-left">Diferencia Entrada vs Salida</th>
                  <th className="border-b border-white/10 p-2 bg-emerald-950/40 text-emerald-300 font-bold text-left">Diferencia Neta</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1 Values */}
                <tr className="text-gray-200 border-b border-white/10">
                  <td className="border-r border-white/10 p-2 text-left font-medium">{formatKg(details.pesoIngreso)}</td>
                  <td className="border-r border-white/10 p-2 text-left font-medium">{hasExit ? formatKg(details.pesoSalida) : 'Pendiente'}</td>
                  <td className="border-r border-white/10 p-2 text-left font-medium">{hasExit ? formatKg(details.diferencia) : 'Pendiente'}</td>
                  <td className="p-2 text-left font-bold bg-emerald-900/20 text-emerald-300">{hasExit ? formatKg(details.diferenciaNeta) : 'Pendiente'}</td>
                </tr>
                {/* Row 2 Headers */}
                <tr className="bg-neutral-800/60 font-semibold text-gray-300">
                  <th className="border-b border-r border-white/10 p-2 text-left">Peso Total Pallets</th>
                  <th className="border-b border-r border-white/10 p-2 bg-emerald-950/40 text-emerald-300 font-bold text-left"># Pallet</th>
                  <th className="border-b border-r border-white/10 p-2 bg-emerald-950/40 text-emerald-300 font-bold text-left">Peso Pallets (25 kg promedio)</th>
                  <th className="border-b border-white/10 p-2 bg-emerald-950/40 text-emerald-300 font-bold text-left">Peso Neto Productos</th>
                </tr>
                {/* Row 2 Values */}
                <tr className="text-gray-200">
                  <td className="border-r border-white/10 p-2 text-left font-medium">{formatKg(details.pesoTotalPalletsCalculado)}</td>
                  <td className="border-r border-white/10 p-2 text-left font-bold bg-emerald-900/20 text-emerald-300">{details.cantidadPallets}</td>
                  <td className="border-r border-white/10 p-2 text-left font-bold bg-emerald-900/20 text-emerald-300">{formatKg(details.pesoPalletsPromedio)}</td>
                  <td className="p-2 text-left font-bold bg-emerald-900/20 text-emerald-300">{formatKg(details.pesoNetoProductos)}</td>
                </tr>
              </tbody>
            </table>
          </div>

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
                  {shouldShowPalletOperationDetails(vehicle.codigoTipoOperacion, pallet) && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-300 border-t border-white/10 pt-2 md:grid-cols-5">
                      <PalletMetric
                        label="Pallet estándar"
                        value={formatNullableKg(pallet.pesoPalletEstandar)}
                      />
                      <PalletMetric
                        label="Pallet aplicado"
                        value={formatNullableKg(pallet.pesoPalletAplicado)}
                      />
                      <PalletMetric
                        label="Peso neto"
                        value={formatNullableKg(pallet.pesoProductoNeto)}
                        highlight={pallet.pesoProductoNeto != null}
                      />
                      <PalletMetric
                        label="Con pallet"
                        value={
                          pallet.productoConPallet == null
                            ? '—'
                            : pallet.productoConPallet
                              ? 'Sí'
                              : 'No'
                        }
                      />
                      <PalletMetric label="Tipo operación" value={vehicle.tipoOperacion || 'N/A'} />
                    </div>
                  )}
                  {(pallet.estadoRecepcion === 'recibido' || pallet.pesoRecibido != null) && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-300 border-t border-white/10 pt-2">
                      <PalletMetric label="Recibido" value={formatKg(pallet.pesoRecibido)} />
                      <PalletMetric
                        label="Dif. recepción"
                        value={formatKg(pallet.diferenciaRecepcion)}
                        highlight={pallet.diferenciaRecepcion != null && Math.abs(pallet.diferenciaRecepcion) > 0.01}
                      />
                      <PalletMetric label="Cód. RECP" value={pallet.codigoRecepcion || '—'} />
                    </div>
                  )}
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

function PalletMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`font-semibold ${highlight ? 'text-red-400' : ''}`}>{value}</div>
    </div>
  )
}

