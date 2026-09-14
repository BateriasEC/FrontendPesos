import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { ToleranciaPesajeConfig } from '../../types/dispositivos'

export function PesoEstandarPalletPanel() {
  const [rows, setRows] = useState<ToleranciaPesajeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [peso, setPeso] = useState('25')
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/configuracion-dispositivos/tolerancias-pesaje')
      const items = response.data?.data || response.data || []
      const list = Array.isArray(items) ? items : []
      setRows(list)
      const activa = list.find((t) => t.activo) ?? list[0]
      if (activa) {
        setPeso(String(activa.pesoEstandarPalletKg ?? 25))
      }
    } catch (error) {
      console.error('Error cargando peso estándar pallet:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toleranciaActiva = rows.find((t) => t.activo) ?? rows[0]

  const save = async () => {
    if (!toleranciaActiva?.id) {
      setMessage('No hay una tolerancia activa. Cree una en la pestaña Tolerancias de peso.')
      return
    }
    const normalized = peso.trim().replace(',', '.')
    const n = Number(normalized)
    if (!Number.isFinite(n) || n < 0) {
      setMessage('Ingrese un peso válido (kg).')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await api.patch(`/configuracion-dispositivos/tolerancias-pesaje/${toleranciaActiva.id}`, {
        pesoEstandarPalletKg: n,
      })
      setMessage('Peso estándar actualizado. La app móvil lo recibirá en la próxima sincronización.')
      await load()
    } catch (error) {
      console.error('Error guardando peso estándar pallet:', error)
      setMessage('No se pudo guardar. Intente de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold">Peso estándar del pallet</h2>
        <p className="text-sm text-white/60 mt-1">
          Valor global usado en recepción sin pallet y mixto. Se precarga en el pesaje y puede
          editarse solo para la transacción actual en la app móvil.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[120px] bg-white/5 rounded border border-white/10">
          <span className="text-white/60">Cargando...</span>
        </div>
      ) : !toleranciaActiva ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          No hay tolerancias configuradas. Cree una en la pestaña &quot;Tolerancias de peso&quot;.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-white/10 bg-neutral-800/40 p-4 space-y-4">
            <div className="text-sm text-white/70">
              Tolerancia activa: <span className="font-semibold text-white">{toleranciaActiva.nombre}</span>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Peso estándar (kg)</span>
              <input
                type="text"
                inputMode="decimal"
                className="input input-bordered w-full max-w-xs bg-neutral-900 border-white/20"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="25"
              />
            </label>
            <p className="text-xs text-white/50">Valor por defecto recomendado: 25 kg</p>
          </div>

          {message && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                message.includes('actualizado')
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar peso estándar'}
          </button>
        </>
      )}
    </div>
  )
}
