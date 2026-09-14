/** Cálculo de peso neto producto para listados y reportes web. */

const CON_PALLET_CODES = new Set(['RECEPCION', 'RECEPCION_CON_PALLET'])
const MIXTO_CODE = 'RECEPCION_MIXTO'

function normalizeCodigo(codigo?: string | null): string {
  return (codigo ?? '').trim().toUpperCase()
}

/**
 * Todo pallet nuevo (con pallet, sin pallet o mixto) trae `pesoPalletAplicado`
 * ya resuelto desde el backend, así que el neto siempre es peso báscula − aplicado.
 * El bloque de abajo (esConPalletDirecto / esMixtoConPallet) es solo un fallback
 * para pallets históricos creados antes de que "con pallet" restara el estándar,
 * cuyo `pesoPalletAplicado` quedó nulo en la base de datos.
 */
export function resolvePesoProductoNetoDisplay(params: {
  pesoTotal: number
  pesoPalletAplicado?: number | null
  productoConPallet?: boolean | null
  codigoTipoOperacion?: string | null
}): number | null {
  const pesoTotal = Number(params.pesoTotal || 0)
  const aplicado =
    params.pesoPalletAplicado != null ? Number(params.pesoPalletAplicado) : null
  const codigo = normalizeCodigo(params.codigoTipoOperacion)

  if (aplicado != null) {
    return Math.max(0, Number((pesoTotal - aplicado).toFixed(2)))
  }

  const esConPalletDirecto = CON_PALLET_CODES.has(codigo)
  const esMixtoConPallet = codigo === MIXTO_CODE && params.productoConPallet === true

  if ((esConPalletDirecto || esMixtoConPallet) && pesoTotal > 0) {
    return Number(pesoTotal.toFixed(2))
  }

  return null
}

const PALLET_OPERATION_CODES = new Set([
  'RECEPCION',
  'RECEPCION_CON_PALLET',
  'RECEPCION_SIN_PALLET',
  'RECEPCION_MIXTO',
])

/** Muestra bloque de datos pallet en reportes cuando el tipo de operación o el registro lo requiere. */
export function shouldShowPalletOperationDetails(
  codigoTipoOperacion?: string | null,
  pallet?: {
    pesoPalletAplicado?: number | null
    productoConPallet?: boolean | null
    pesoProductoNeto?: number | null
    pesoPalletEstandar?: number | null
  },
): boolean {
  if (pallet?.pesoPalletAplicado != null) return true
  if (pallet?.pesoPalletEstandar != null) return true
  if (pallet?.productoConPallet != null) return true
  if (pallet?.pesoProductoNeto != null) return true
  return PALLET_OPERATION_CODES.has(normalizeCodigo(codigoTipoOperacion))
}

export function formatNullableKg(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Number(value).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`
}
