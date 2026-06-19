import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { Modal } from '../Modal'
import { Pagination } from '../Pagination'
import type { ToleranciaPesajeConfig } from '../../types/dispositivos'

type FormState = {
  nombre: string
  margenPalletSimetricoKg: string
  variacionRepesajeAlertaPorcentaje: string
  toleranciaCuadreCargaKg: string
  activo: boolean
}

const emptyForm: FormState = {
  nombre: 'Principal',
  margenPalletSimetricoKg: '0',
  variacionRepesajeAlertaPorcentaje: '0.5',
  toleranciaCuadreCargaKg: '5',
  activo: true,
}

export function ToleranciasPesajePanel() {
  const [rows, setRows] = useState<ToleranciaPesajeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ToleranciaPesajeConfig | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [page, setPage] = useState(1)
  const pageSize = 8

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/configuracion-dispositivos/tolerancias-pesaje')
      const items = response.data?.data || response.data || []
      setRows(Array.isArray(items) ? items : [])
    } catch (error) {
      console.error('Error cargando tolerancias de pesaje:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page],
  )

  const parseNum = (value: string, fallback: number) => {
    const normalized = value.trim().replace(',', '.')
    if (normalized === '' || normalized === '-') return fallback
    const n = Number(normalized)
    return Number.isFinite(n) ? n : fallback
  }

  const openNew = () => {
    setEditing({} as ToleranciaPesajeConfig)
    setForm(emptyForm)
  }

  const openEdit = (item: ToleranciaPesajeConfig) => {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      margenPalletSimetricoKg: String(item.margenPalletSimetricoKg),
      variacionRepesajeAlertaPorcentaje: String(item.variacionRepesajeAlertaPorcentaje),
      toleranciaCuadreCargaKg: String(item.toleranciaCuadreCargaKg),
      activo: item.activo,
    })
  }

  const save = async () => {
    const margen = parseNum(form.margenPalletSimetricoKg, 0)
    const payload = {
      nombre: form.nombre.trim(),
      margenPalletSimetricoKg: margen,
      variacionRepesajeAlertaPorcentaje: parseNum(form.variacionRepesajeAlertaPorcentaje, 0.5),
      toleranciaCuadreCargaKg: parseNum(form.toleranciaCuadreCargaKg, margen > 0 ? margen : 5),
      activo: form.activo,
    }

    if (editing?.id) {
      await api.patch(`/configuracion-dispositivos/tolerancias-pesaje/${editing.id}`, payload)
    } else {
      await api.post('/configuracion-dispositivos/tolerancias-pesaje', payload)
    }

    await load()
    setEditing(null)
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar esta tolerancia?')) return
    await api.delete(`/configuracion-dispositivos/tolerancias-pesaje/${id}`)
    await load()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tolerancias de pesaje</h2>
        <p className="text-sm text-white/60 mt-1">
          Equivalente a la app móvil: rango permitido ± kg respecto al peso de referencia. Si es 0,
          se usa automáticamente ±0,5 % del peso de referencia.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={openNew} className="btn btn-primary">
          Nueva tolerancia
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px] bg-white/5 rounded border border-white/10">
          <span className="text-white/60">Cargando...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rango ± kg</th>
                  <th>Alerta repesaje %</th>
                  <th>Cuadre carga kg</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-white/50 py-8">
                      No hay tolerancias registradas.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.nombre}</td>
                      <td>{row.margenPalletSimetricoKg}</td>
                      <td>{row.variacionRepesajeAlertaPorcentaje}%</td>
                      <td>{row.toleranciaCuadreCargaKg}</td>
                      <td>{row.activo ? 'Activa' : 'Inactiva'}</td>
                      <td className="text-right space-x-2">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm text-red-300" onClick={() => remove(row.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={rows.length} onChange={setPage} />
        </>
      )}

      <Modal
        open={!!editing}
        title={editing?.id ? 'Editar tolerancia' : 'Nueva tolerancia de pesaje'}
        onClose={() => setEditing(null)}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nombre *</label>
            <input
              className="input w-full"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Rango permitido (± kg)</label>
            <input
              className="input w-full"
              value={form.margenPalletSimetricoKg}
              onChange={(e) => setForm((f) => ({ ...f, margenPalletSimetricoKg: e.target.value }))}
              placeholder="Ej: 5 (0 = usar ±0,5%)"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Umbral alerta repesaje (%)</label>
            <input
              className="input w-full"
              value={form.variacionRepesajeAlertaPorcentaje}
              onChange={(e) => setForm((f) => ({ ...f, variacionRepesajeAlertaPorcentaje: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Tolerancia cuadre de carga (kg)</label>
            <input
              className="input w-full"
              value={form.toleranciaCuadreCargaKg}
              onChange={(e) => setForm((f) => ({ ...f, toleranciaCuadreCargaKg: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            Configuración activa
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" disabled={!form.nombre.trim()} onClick={save}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
