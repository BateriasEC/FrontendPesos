import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type TipoOperacion = {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
}

const emptyForm: Omit<TipoOperacion, 'id'> = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activo: true,
}

export default function TiposOperacion() {
  const [rows, setRows] = useState<TipoOperacion[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<TipoOperacion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/tipos-operacion')
      const items = response.data?.data || response.data || []
      setRows(Array.isArray(items) ? items : [])
    } catch (error) {
      console.error('Error cargando tipos de operación:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        row.nombre.toLowerCase().includes(q.toLowerCase()) ||
        row.codigo.toLowerCase().includes(q.toLowerCase())
      const matchesEstado =
        estado === 'all' ||
        (estado === 'active' && row.activo) ||
        (estado === 'inactive' && !row.activo)
      return matchesQuery && matchesEstado
    })
  }, [rows, q, estado])

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  )

  const openNew = () => {
    setEditing({} as TipoOperacion)
    setForm(emptyForm)
  }

  const openEdit = (item: TipoOperacion) => {
    setEditing(item)
    setForm({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo,
    })
  }

  const save = async () => {
    const payload = {
      ...form,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || undefined,
    }

    if (editing?.id) {
      await api.patch(`/tipos-operacion/${editing.id}`, payload)
    } else {
      await api.post('/tipos-operacion', payload)
    }

    await load()
    setEditing(null)
  }

  const toggleActivo = async (item: TipoOperacion) => {
    await api.patch(`/tipos-operacion/${item.id}`, { activo: !item.activo })
    await load()
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este tipo de operación?')) return
    await api.delete(`/tipos-operacion/${id}`)
    await load()
  }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Tipos de Operación</h1>

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
            <p className="text-gray-400">Cargando tipos de operación...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-white/10">
          <table className="table table-zebra w-full min-w-[700px]">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-left">Activo</th>
                <th className="p-2 text-center w-56">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="p-2 font-mono text-sm">{item.codigo}</td>
                  <td className="p-2">{item.nombre}</td>
                  <td className="p-2 text-gray-300">{item.descripcion || '-'}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing?.id ? 'Editar tipo de operación' : 'Crear tipo de operación'}
        onClose={() => setEditing(null)}
      >
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Código</label>
            <input
              className="mt-1 input"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="RECEPCION"
            />
          </div>
          <div>
            <label className="block text-sm">Nombre</label>
            <input
              className="mt-1 input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Recepción"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm">Descripción</label>
            <input
              className="mt-1 input"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activo
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setEditing(null)} className="btn btn-ghost">
            Cancelar
          </button>
          <button onClick={save} className="btn btn-primary">
            Guardar
          </button>
        </div>
      </Modal>
    </div>
  )
}
