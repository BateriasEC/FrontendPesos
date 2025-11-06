import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Cliente = { id: number; nombre: string; ruc: string; contacto: string; estado: 'activo' | 'inactivo' }

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<Cliente['estado'] | ''>('')

  const load = async () => { const { data } = await api.get('/clients'); setRows(data) }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.nombre.toLowerCase().includes(q.toLowerCase()) || (r as any).ruc?.toLowerCase().includes(q.toLowerCase())) &&
    (!estado || r.estado === estado)
  )), [rows, q, estado])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const [editing, setEditing] = useState<Cliente | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<Omit<Cliente, 'id'>>({ nombre: '', ruc: '', contacto: '', estado: 'activo' })

  const openNew = () => { 
    setEditing(null); 
    setForm({ nombre: '', ruc: '', contacto: '', estado: 'activo' });
    setIsModalOpen(true);
  }
  const openEdit = (c: Cliente) => { 
    setEditing(c); 
    setForm({ nombre: c.nombre, ruc: (c as any).ruc || '', contacto: c.contacto, estado: c.estado });
    setIsModalOpen(true);
  }
  const save = async () => { 
    try {
      if (editing) {
        await api.patch(`/clients/${editing.id}`, form);
      } else {
        await api.post(`/clients`, form);
      }
      await load();
      setIsModalOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('Error guardando cliente:', error);
    }
  }
  const remove = async (id: number) => { 
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await api.delete(`/clients/${id}`);
        await load();
      } catch (error) {
        console.error('Error eliminando cliente:', error);
      }
    }
  }
  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input className="mt-1 input" placeholder="Nombre o RUC" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Estado</label>
          <select className="mt-1 select" value={estado} onChange={e=>setEstado(e.target.value as any)}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="table table-zebra">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">RUC</th>
              <th className="p-2 text-left">Contacto</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{c.nombre}</td>
                <td className="p-2">{(c as any).ruc}</td>
                <td className="p-2">{c.contacto}</td>
                <td className="p-2 capitalize">{c.estado}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={()=>openEdit(c)} className="text-xs btn btn-ghost w-24">Editar</button>
                    <button onClick={()=>remove(c.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
      </div>

      <Modal open={isModalOpen} title={editing ? 'Editar cliente' : 'Crear cliente'} onClose={closeModal}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Nombre</label>
            <input className="mt-1 input" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">RUC</label>
            <input className="mt-1 input" value={(form as any).ruc} onChange={e=>setForm({...form, ruc: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Correo/Contacto</label>
            <input className="mt-1 input" value={form.contacto} onChange={e=>setForm({...form, contacto: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Estado</label>
            <select className="mt-1 select" value={form.estado} onChange={e=>setForm({...form, estado: e.target.value as any})}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={closeModal} className="btn btn-ghost">Cancelar</button>
          <button onClick={save} className="btn btn-primary">Guardar</button>
        </div>
      </Modal>
    </div>
  )
}


