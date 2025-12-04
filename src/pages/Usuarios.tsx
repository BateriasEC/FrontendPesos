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
    try {
      const response = await api.get('/users')
      // El backend devuelve { data: [...] } por el TransformInterceptor
      const users = response.data?.data || response.data || []
      // Mapear el formato del backend al formato esperado por la web
      const mappedUsers = users.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.name || u.username || '',
        email: u.email || '',
        role: (u.role?.codigo || u.role || 'OPERADOR').toLowerCase() as 'admin' | 'supervisor' | 'operador',
        password: '' // No se envía la contraseña desde el backend
      }))
      setRows(mappedUsers)
    } catch (error: any) {
      console.error('Error cargando usuarios:', error)
      alert(error.response?.data?.message || error.message || 'Error al cargar usuarios')
      setRows([])
    }
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
  const [roles, setRoles] = useState<Array<{id: string, codigo: string, nombre: string}>>([])

  // Cargar roles al montar el componente
  useEffect(() => {
    const loadRoles = async () => {
      try {
        // Buscar roles en la respuesta de usuarios o crear un endpoint
        // Por ahora, mapeamos los códigos de rol conocidos
        const roleMap: Record<string, string> = {
          'admin': 'ADMIN',
          'supervisor': 'SUPERVISOR',
          'operador': 'OPERADOR'
        }
        // Intentar obtener roles desde el backend (si existe endpoint)
        // Si no, usar los códigos conocidos
        setRoles([
          { id: '', codigo: 'ADMIN', nombre: 'Administrador' },
          { id: '', codigo: 'SUPERVISOR', nombre: 'Supervisor' },
          { id: '', codigo: 'OPERADOR', nombre: 'Operador' }
        ])
      } catch (err) {
        console.error('Error cargando roles:', err)
      }
    }
    loadRoles()
  }, [])

  const openNew = () => { setEditing({} as any); setForm({ name: '', email: '', role: 'operador', password: '' }) }
  const openEdit = (u: Usuario) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, password: u.password }) }

  const save = async () => {
    try {
      // Mapear el formato de la web al formato del backend
      const roleCodeMap: Record<string, string> = {
        'admin': 'ADMIN',
        'supervisor': 'SUPERVISOR',
        'operador': 'OPERADOR'
      }
      
      // Convertir el rol a código
      const roleCode = roleCodeMap[form.role] || 'OPERADOR'

      // Generar username desde el email (parte antes del @)
      const username = form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

      const backendData = {
        username: username,
        email: form.email,
        fullName: form.name,
        password: form.password,
        roleCode: roleCode  // El backend ahora acepta roleCode y lo convierte a roleId
      }

      if (editing) {
        if ((editing as any).id) {
          await api.patch(`/users/${(editing as any).id}`, backendData)
        } else {
          await api.post(`/users`, backendData)
        }
      } else {
        await api.post(`/users`, backendData)
      }
      await load()
      setEditing(null)
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al guardar usuario')
      console.error('Error guardando usuario:', err)
    }
  }
  const remove = async (id: number) => { await api.delete(`/users/${id}`); await load() }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      
      <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
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

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="table table-zebra w-full min-w-[600px]">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Correo</th>
              <th className="text-left p-2">Rol</th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              pageRows.map((u, i) => (
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
              ))
            )}
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


