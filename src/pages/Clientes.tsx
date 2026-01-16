import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Cliente = {
  id: string
  nombre: string
  ruc?: string
  contacto?: string
  estado: 'activo' | 'inactivo'
}

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<Cliente['estado'] | ''>('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/clients')
      const clients = response.data?.data || response.data || []

      const mappedClients = clients.map((c: any) => ({
        id: c.id,
        nombre: c.nombre || '',
        ruc: c.ruc || '',
        contacto: c.contacto || '',
        estado: (c.estado?.codigo || 'ACTIVO').toLowerCase() as 'activo' | 'inactivo'
      }))

      setRows(mappedClients)
    } catch (error: any) {
      console.error('Error cargando clientes:', error)
      alert(error.response?.data?.message || error.message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.nombre.toLowerCase().includes(q.toLowerCase()) || r.ruc?.toLowerCase().includes(q.toLowerCase())) &&
    (!estado || r.estado === estado)
  )), [rows, q, estado])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  )

  const [editing, setEditing] = useState<Cliente | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    ruc: '',
    contacto: '',
    estado: 'activo' as 'activo' | 'inactivo'
  })

  const openNew = () => {
    setEditing(null)
    setForm({ nombre: '', ruc: '', contacto: '', estado: 'activo' })
    setIsModalOpen(true)
  }

  const openEdit = (c: Cliente) => {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      ruc: c.ruc || '',
      contacto: c.contacto || '',
      estado: c.estado
    })
    setIsModalOpen(true)
  }

  const save = async () => {
    try {
      // 🔥 PAYLOAD LIMPIO (solo lo que acepta el backend)
      const payload = {
        nombre: form.nombre,
        ruc: form.ruc || undefined,
        contacto: form.contacto || undefined,
      }

      if (editing) {
        await api.patch(`/clients/${editing.id}`, payload)
      } else {
        await api.post('/clients', payload)
      }

      await load()
      setIsModalOpen(false)
      setEditing(null)
    } catch (error) {
      console.error('Error guardando cliente:', error)
    }
  }

  const remove = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await api.delete(`/clients/${id}`)
        await load()
      } catch (error) {
        console.error('Error eliminando cliente:', error)
      }
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-xl font-bold">Clientes</h1>

      <div className="flex flex-col gap-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="input" placeholder="Buscar" value={q} onChange={e => setQ(e.target.value)} />
          <select className="select" value={estado} onChange={e => setEstado(e.target.value as any)}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <button onClick={openNew} className="btn btn-primary">Nuevo Cliente</button>
        </div>
      </div>

      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUC</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map(c => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.ruc}</td>
              <td>{c.contacto}</td>
              <td className="capitalize">{c.estado}</td>
              <td className="flex gap-2 justify-center">
                <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm">Editar</button>
                <button onClick={() => remove(c.id)} className="btn btn-sm bg-red-500/20 text-red-300">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />

      <Modal open={isModalOpen} title={editing ? 'Editar cliente' : 'Crear cliente'} onClose={closeModal}>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input className="input" placeholder="RUC" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} />
          <input className="input col-span-2" placeholder="Contacto" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={closeModal} className="btn btn-ghost">Cancelar</button>
          <button onClick={save} className="btn btn-primary">Guardar</button>
        </div>
      </Modal>
    </div>
  )
}


