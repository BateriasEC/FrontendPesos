import { useEffect, useState } from 'react'
import { api } from '../services/api'

type IngresoOption = {
  id: string
  codigoTrazabilidad: string
  ingresoAt: string
  enPlanta: boolean
}

type CambiarIngresoModalProps = {
  pallet: { id: string | number; placa: string; vehicleId?: string } | null
  onClose: () => void
  onChanged: () => void
}

const normalizePlaca = (placa: string) => placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()

export function CambiarIngresoModal({ pallet, onClose, onChanged }: CambiarIngresoModalProps) {
  const [opciones, setOpciones] = useState<IngresoOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!pallet) {
      setOpciones([])
      setSelectedId(null)
      setError(null)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/vehicles', { params: { search: pallet.placa } })
        const list = res.data?.data ?? res.data
        const vehicles: any[] = Array.isArray(list) ? list : []

        const key = normalizePlaca(pallet.placa)
        const otrosIngresos = vehicles
          .filter((v) => normalizePlaca(v.placa) === key && v.id !== pallet.vehicleId)
          .sort((a, b) => new Date(b.ingresoAt).getTime() - new Date(a.ingresoAt).getTime())
          .map((v) => ({
            id: v.id,
            codigoTrazabilidad: v.codigoTrazabilidad || 'N/A',
            ingresoAt: v.ingresoAt,
            enPlanta: (v.estado?.codigo || v.estado) === 'EN_PLANTA',
          }))

        setOpciones(otrosIngresos)
      } catch (err) {
        console.error('[CambiarIngresoModal] Error cargando ingresos:', err)
        setError('No se pudieron cargar los otros ingresos de esta placa.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [pallet])

  if (!pallet) return null

  const confirmar = async () => {
    if (!selectedId) return
    setSubmitting(true)
    setError(null)
    try {
      await api.patch(`/pallets/${pallet.id}/cambiar-ingreso`, { vehicleId: selectedId })
      onChanged()
      onClose()
    } catch (err: any) {
      setError(err?.userMessage || err?.response?.data?.message || 'No se pudo cambiar el ingreso del pallet.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Cambiar de Ingreso</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Placa <span className="font-semibold">{pallet.placa}</span>. Elige el ingreso correcto al que debe
            quedar asociado este pallet.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-orange" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg p-3">{error}</div>
          ) : opciones.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg p-3">
              No se encontraron otros ingresos para esta placa.
            </div>
          ) : (
            <div className="space-y-2">
              {opciones.map((op) => {
                const fecha = new Date(op.ingresoAt)
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedId(op.id)}
                    className={`w-full text-left rounded-lg border p-3 transition ${
                      selectedId === op.id
                        ? 'border-brand-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-800 break-all">
                        {op.codigoTrazabilidad}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-bold px-2 py-1 rounded ${
                          op.enPlanta ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {op.enPlanta ? 'EN PLANTA' : 'HISTÓRICO'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fecha.toLocaleDateString('es-EC')}{' '}
                      <span className="font-semibold">
                        {fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={!selectedId || submitting}
              className="px-4 py-2 bg-brand-orange hover:opacity-90 text-white rounded font-medium disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : 'Confirmar cambio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
