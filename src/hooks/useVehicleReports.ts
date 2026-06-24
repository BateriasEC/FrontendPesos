import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

export type VehicleGeneralFilter =
  | 'all'
  | 'withPendingPallets'
  | 'withCompletedPallets'
  | 'withoutPallets'
  | 'withExit'
  | 'withEntry'

export type ReportPallet = {
  id: string
  codigo: string
  producto: string
  pesoInicial: number
  pesoDespacho: number | null
  diferencia: number | null
  estado: 'pendiente' | 'completado'
  fechaPesaje: string
  horaPesaje: string
  fechaDespacho: string | null
  horaDespacho: string | null
  codigoRecepcion?: string | null
  pesoRecibido?: number | null
  diferenciaRecepcion?: number | null
  diferenciaRecepcionPorcentaje?: number | null
  estadoRecepcion?: 'recibido' | 'pendiente_recepcion' | null
  fechaRecepcion?: string | null
  horaRecepcion?: string | null
  recibidoPor?: string | null
  pesoPalletEstandar?: number | null
  pesoPalletAplicado?: number | null
  productoConPallet?: boolean | null
  pesoProductoNeto?: number | null
}

export type ReportVehicle = {
  id: string
  numero: number
  placa: string
  cliente: string
  producto: string
  canalVehiculo?: string
  tipoVehiculo: string
  tipoOperacion?: string
  codigoTipoOperacion?: string
  codigoCanalVehiculo?: string
  codigoTrazabilidad: string
  operador: string
  fechaRegistro: string
  horaRegistro: string
  pesoIngreso: number
  pesoSalida: number
  diferencia: number
  pesoTotalPallets: number
  pallets: ReportPallet[]
  resumen: {
    totalPalletsRegistrados: number
    palletsSinDespachar: number
    pesoSinDespachar: number
    palletsDespachados: number
    pesoDespachado: number
  }
}

type ReportResponse = {
  vehicles: ReportVehicle[]
  charts: {
    byDay: Array<{ day: string; total: number; pallets: number; peso: number }>
    deviationByProduct: Array<{
      product: string
      avg: number
      registros: number
      despachados: number
      pendientes: number
    }>
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type VehicleReportFilters = {
  from: string
  to: string
  vehicleFilter: VehicleGeneralFilter
  placa: string
  page: number
  limit: number
}

function firstDayOfCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function unwrapReportResponse(data: unknown): ReportResponse {
  const maybeWrapped = data as { data?: ReportResponse }
  return maybeWrapped.data ?? (data as ReportResponse)
}

export function defaultReportFilters(): VehicleReportFilters {
  return {
    from: firstDayOfCurrentMonth(),
    to: todayIso(),
    vehicleFilter: 'all',
    placa: '',
    page: 1,
    limit: 10,
  }
}

export function useVehicleReports(initialFilters = defaultReportFilters()) {
  const [filters, setFilters] = useState<VehicleReportFilters>(initialFilters)
  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const params = useMemo(() => ({
    from: filters.from,
    to: filters.to,
    vehicleFilter: filters.vehicleFilter,
    placa: filters.placa || undefined,
    page: filters.page,
    limit: filters.limit,
  }), [filters])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/pallets/reports/vehicles', { params })
      setData(unwrapReportResponse(response.data))
    } catch (err) {
      console.error('Error cargando reportes:', err)
      setError('No se pudieron cargar los reportes.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void load()
  }, [load])

  return { filters, setFilters, data, loading, error, reload: load }
}

