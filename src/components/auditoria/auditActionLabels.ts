/**
 * Traduce los codigos de operacion del backend (audit-actions.constants.ts)
 * a la etiqueta que el operador reconoce en la app: la pantalla real donde
 * ocurrio la operacion, no un CREATE/UPDATE generico.
 */
const LABELS: Record<string, string> = {
  VEHICLE_INGRESO: 'Registrar ingreso',
  VEHICLE_SALIDA: 'Registrar salida',
  VEHICLE_ACTUALIZACION: 'Corrección de vehículo',
  PALLET_PESAJE: 'Pesaje de pallet',
  PALLET_DESCARGA: 'Despacho (descarga)',
  PALLET_REPESAJE: 'Repesaje',
  PALLET_CAMBIO_INGRESO: 'Cambio de ingreso',
  PALLET_ACTUALIZACION: 'Corrección de pallet',
  PALLET_RECEPCION: 'Recepción en producción',
}

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action
}
