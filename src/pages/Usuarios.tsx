import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'

type Usuario = { id: number; name: string; email: string; role: 'admin' | 'supervisor' | 'operador'; password: string }

export default function Usuarios() {
  const [rows, setRows] = useState<Usuario[]>([])
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Usuario['role'] | ''>('')

  const load = async () => {
    const { data } = await api.get('/users')
    setRows(data)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter(r => (
    (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase())) &&
    (!role || r.role === role)
  )), [rows, q, role])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<Omit<Usuario, 'id'>>({ name: '', email: '', role: 'operador', password: '' })

  const openNew = () => { setEditing({} as any); setForm({ name: '', email: '', role: 'operador', password: '' }) }
  const openEdit = (u: Usuario) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, password: u.password }) }

  const save = async () => {
    if (editing) {
      if ((editing as any).id) {
        await api.patch(`/users/${(editing as any).id}`, form)
      } else {
        await api.post(`/users`, form)
      }
    } else {
      await api.post(`/users`, form)
    }
    await load()
    setEditing(null)
  }
  const remove = async (id: number) => { await api.delete(`/users/${id}`); await load() }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="mt-1 input" placeholder="Nombre o correo" />
        </div>
        <div>
          <label className="block text-sm">Rol</label>
          <select value={role} onChange={e=>setRole(e.target.value as any)} className="mt-1 select">
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="operador">Operador</option>
          </select>
        </div>
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="table table-zebra">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Correo</th>
              <th className="text-left p-2">Rol</th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">
                  <div className="w-full flex justify-center items-center gap-2">
                    <button onClick={()=>openEdit(u)} className="text-xs btn btn-ghost w-24">Editar</button>
                    <button onClick={()=>remove(u.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
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

      <Modal open={!!editing} title={(editing && (editing as any).id) ? 'Editar usuario' : 'Crear usuario'} onClose={()=>setEditing(null)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Nombre</label>
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="mt-1 input" />
          </div>
          <div>
            <label className="block text-sm">Correo</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 input" />
          </div>
          <div>
            <label className="block text-sm">Rol</label>
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value as any})} className="mt-1 select">
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="operador">Operador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Contraseña</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="mt-1 input" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={()=>setEditing(null)} className="btn btn-ghost">Cancelar</button>
          <button onClick={save} className="btn btn-primary">Guardar</button>
        </div>
      </Modal>
    </div>
  )
}


