export type TipoDispositivo = 'IMPRESORA' | 'BALANZA' | 'PDA'

export type RolBalanza = 'INGRESO_SALIDA' | 'PALLETS' | 'DESPACHO' | 'OTRO'

export interface DispositivoConfig {
  id: string
  tipo: TipoDispositivo
  nombre: string
  ip?: string | null
  puerto?: number | null
  habilitado: boolean
  rolBalanza?: RolBalanza | null
  identificador?: string | null
  descripcion?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ToleranciaPesajeConfig {
  id: string
  nombre: string
  margenPalletSimetricoKg: number
  variacionRepesajeAlertaPorcentaje: number
  toleranciaCuadreCargaKg: number
  activo: boolean
}

export const ROL_BALANZA_LABELS: Record<RolBalanza, string> = {
  INGRESO_SALIDA: 'Balanza 1 (Ingreso/Salida)',
  PALLETS: 'Balanza 2 (Pallets)',
  DESPACHO: 'Balanza 3 (Despacho)',
  OTRO: 'Otra / adicional',
}
