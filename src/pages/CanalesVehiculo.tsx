import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type CanalVehiculo = {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
  orden: number
}

const emptyForm: Omit<CanalVehiculo, 'id'> = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activo: true,
  orden: 0,
}

export default function CanalesVehiculo() {
  const [rows, setRows] = useState<CanalVehiculo[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<CanalVehiculo | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)
  const [debouncedQ, setDebouncedQ] = useState('')

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Reset page to 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, estado]);

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/canales-vehiculo', {
        params: {
          page,
          limit: pageSize,
          search: debouncedQ || undefined,
          activo: estado === 'all' ? undefined : (estado === 'active'),
        }
      })
      const responseData = response.data?.data ?? response.data
      const items = responseData?.data || []
      const totalCount = responseData?.total ?? 0

      setRows(Array.isArray(items) ? items : [])
      setTotal(totalCount)
    } catch (error) {
      console.error('Error cargando canales de vehículo:', error)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, estado])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing({} as CanalVehiculo)
    setForm(emptyForm)
  }

  const openEdit = (item: CanalVehiculo) => {
    setEditing(item)
    setForm({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo,
      orden: item.orden ?? 0,
    })
  }

  const save = async () => {
    const payload = {
      ...form,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || undefined,
      orden: Number(form.orden) || 0,
    }

    if (editing?.id) {
      await api.patch(`/canales-vehiculo/${editing.id}`, payload)
    } else {
      await api.post('/canales-vehiculo', payload)
    }

    await load()
    setEditing(null)
  }

  const toggleActivo = async (item: CanalVehiculo) => {
    await api.patch(`/canales-vehiculo/${item.id}`, { activo: !item.activo })
    await load()
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este canal de vehículo?')) return
    await api.delete(`/canales-vehiculo/${id}`)
    await load()
  }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Canales del Vehículo</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input
            className="mt-1 input"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Código o nombre"
          />
        </div>

        <div>
          <label className="block text-sm">Estado</label>
          <select
            className="mt-1 select"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as typeof estado)
              setPage(1)
            }}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <button onClick={openNew} className="ml-auto btn btn-primary">
          Nuevo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" />
            <p className="text-gray-400">Cargando canales...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-white/10">
          <table className="table table-zebra w-full min-w-[800px]">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-left">Orden</th>
                <th className="p-2 text-left">Activo</th>
                <th className="p-2 text-center w-56">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No hay canales de vehículo registrados
                  </td>
                </tr>
              ) : (
                rows.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                    <td className="p-2 font-mono text-sm">{item.codigo}</td>
                    <td className="p-2">{item.nombre}</td>
                    <td className="p-2 text-gray-300">{item.descripcion || '-'}</td>
                    <td className="p-2">{item.orden ?? 0}</td>
                    <td className="p-2">{item.activo ? 'Sí' : 'No'}</td>
                    <td className="p-2">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => openEdit(item)} className="text-xs btn btn-ghost w-20">
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(item)}
                          className="text-xs btn btn-ghost w-24"
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-xs btn w-20 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-400">
            {total > 0 ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros` : 'No hay registros'}
          </span>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
          />
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing?.id ? 'Editar canal de vehículo' : 'Crear canal de vehículo'}
        onClose={() => setEditing(null)}
      >
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Código</label>
            <input
              className="mt-1 input"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="EJ: CLIENTES_UNIDADES"
            />
          </div>

          <div>
            <label className="block text-sm">Orden</label>
            <input
              className="mt-1 input"
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm">Nombre</label>
            <input
              className="mt-1 input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre visible"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm">Descripción</label>
            <input
              className="mt-1 input"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Opcional"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <label className="block text-sm">Activo</label>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setEditing(null)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={save}>
            Guardar
          </button>
        </div>
      </Modal>
    </div>
  )
}

