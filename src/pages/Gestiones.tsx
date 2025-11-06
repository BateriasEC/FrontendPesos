import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Gestion = { id: number; nombre: string; tipo: 'entrada' | 'salida'; activo: boolean }

export default function Gestiones() {
  const [rows, setRows] = useState<Gestion[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Gestion | null>(null)
  const [form, setForm] = useState<Omit<Gestion, 'id'>>({ nombre: '', tipo: 'entrada', activo: true })

  const load = async () => { const { data } = await api.get('/gestiones'); setRows(data) }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows.filter(r => !q || r.nombre.toLowerCase().includes(q.toLowerCase())), [rows, q])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const openNew = () => { setEditing({} as any); setForm({ nombre: '', tipo: 'entrada', activo: true }) }
  const openEdit = (g: Gestion) => { setEditing(g); setForm({ nombre: g.nombre, tipo: g.tipo, activo: g.activo }) }
  const save = async () => {
    if (editing && (editing as any).id) await api.patch(`/gestiones/${(editing as any).id}`, form)
    else await api.post(`/gestiones`, form)
    await load(); setEditing(null)
  }
  const remove = async (id: number) => { await api.delete(`/gestiones/${id}`); await load() }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input className="mt-1 input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre" />
        </div>
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="table table-zebra">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Activo</th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((g, i) => (
              <tr key={g.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{g.nombre}</td>
                <td className="p-2 capitalize">{g.tipo}</td>
                <td className="p-2">{g.activo ? 'Sí' : 'No'}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={()=>openEdit(g)} className="text-xs btn btn-ghost w-24">Editar</button>
                    <button onClick={()=>remove(g.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
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

      <Modal open={!!editing} title={(editing && (editing as any).id) ? 'Editar gestión' : 'Crear gestión'} onClose={()=>setEditing(null)}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Nombre</label>
            <input className="mt-1 input" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Tipo</label>
            <select className="mt-1 select" value={form.tipo} onChange={e=>setForm({...form, tipo: e.target.value as any})}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo: e.target.checked})} />
              Activo
            </label>
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


