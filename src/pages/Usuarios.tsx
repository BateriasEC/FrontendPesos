import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'

type Usuario = { id: number; name: string; email: string; role: 'admin' | 'supervisor' | 'operador'; password: string }

export default function Usuarios() {
  const [rows, setRows] = useState<Usuario[]>([])
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Usuario['role'] | ''>('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

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
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Usuarios</h1>
      
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Buscar</label>
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              className="w-full input text-sm" 
              placeholder="Nombre o correo" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Rol</label>
            <select 
              value={role} 
              onChange={e=>setRole(e.target.value as any)} 
              className="w-full select text-sm"
            >
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="operador">Operador</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button onClick={openNew} className="w-full sm:w-auto btn btn-primary">Nuevo Usuario</button>
          </div>
        </div>
      </div>

      {/* Vista de tabla para desktop */}
      {loading ? (
        <div className="hidden md:flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded border border-white/10">
          <table className="table table-zebra w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-2 text-sm">Nombre</th>
                <th className="text-left p-2 text-sm">Correo</th>
                <th className="text-left p-2 text-sm">Rol</th>
                <th className="p-2 text-center text-sm w-48">Acciones</th>
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
                    <td className="p-2 text-sm">{u.name}</td>
                    <td className="p-2 text-sm">{u.email}</td>
                    <td className="p-2 text-sm capitalize">{u.role}</td>
                    <td className="p-2">
                      <div className="w-full flex justify-center items-center gap-2">
                        <button onClick={()=>openEdit(u)} className="text-xs btn btn-ghost w-20">Editar</button>
                        <button onClick={()=>remove(u.id)} className="text-xs btn w-20 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista de cards para móvil */}
      {loading ? (
        <div className="md:hidden flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <div className="md:hidden space-y-3">
          {pageRows.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-white/5 rounded border border-white/10">
              No hay usuarios registrados
            </div>
          ) : (
            pageRows.map((u) => (
              <div key={u.id} className="bg-white/5 rounded border border-white/10 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{u.name}</h3>
                  <p className="text-sm text-gray-300 mt-1">{u.email}</p>
                </div>
                <span className="px-2 py-1 rounded text-xs capitalize bg-blue-500/20 text-blue-300">
                  {u.role}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex gap-2">
                  <button 
                    onClick={()=>openEdit(u)} 
                    className="flex-1 btn btn-ghost text-sm py-2"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={()=>remove(u.id)} 
                    className="flex-1 btn bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm py-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </div>
      )}

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


