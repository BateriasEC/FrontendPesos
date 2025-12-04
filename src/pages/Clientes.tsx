import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Cliente = { id: number; nombre: string; ruc: string; contacto: string; estado: 'activo' | 'inactivo' }

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<Cliente['estado'] | ''>('')

  const load = async () => {
    try {
      const response = await api.get('/clients')
      // El backend devuelve { data: [...] } por el TransformInterceptor
      const clients = response.data?.data || response.data || []
      // Mapear el formato del backend al formato esperado por la web
      const mappedClients = clients.map((c: any) => ({
        id: c.id,
        nombre: c.nombre || '',
        ruc: c.ruc || '',
        contacto: c.contacto || '',
        estado: (c.estado?.codigo || c.estado || 'ACTIVO').toLowerCase() as 'activo' | 'inactivo'
      }))
      setRows(mappedClients)
    } catch (error: any) {
      console.error('Error cargando clientes:', error)
      alert(error.response?.data?.message || error.message || 'Error al cargar clientes')
      setRows([])
    }
  }
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
    <div className="space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Clientes</h1>
      
      {/* Filtros y botón - Mejorado para móvil */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Buscar</label>
            <input 
              className="w-full input text-sm" 
              placeholder="Nombre o RUC" 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Estado</label>
            <select 
              className="w-full select text-sm" 
              value={estado} 
              onChange={e=>setEstado(e.target.value as any)}
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button onClick={openNew} className="w-full sm:w-auto btn btn-primary">Nuevo Cliente</button>
          </div>
        </div>
      </div>

      {/* Vista de tabla para desktop, cards para móvil */}
      <div className="hidden md:block overflow-x-auto rounded border border-white/10">
        <table className="table table-zebra w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left text-sm">Nombre</th>
              <th className="p-2 text-left text-sm">RUC</th>
              <th className="p-2 text-left text-sm">Contacto</th>
              <th className="p-2 text-left text-sm">Estado</th>
              <th className="p-2 text-center text-sm w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              pageRows.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="p-2 text-sm">{c.nombre}</td>
                  <td className="p-2 text-sm">{(c as any).ruc}</td>
                  <td className="p-2 text-sm">{c.contacto}</td>
                  <td className="p-2 text-sm capitalize">{c.estado}</td>
                  <td className="p-2">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={()=>openEdit(c)} className="text-xs btn btn-ghost w-20">Editar</button>
                      <button onClick={()=>remove(c.id)} className="text-xs btn w-20 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3">
        {pageRows.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-white/5 rounded border border-white/10">
            No hay clientes registrados
          </div>
        ) : (
          pageRows.map((c) => (
            <div key={c.id} className="bg-white/5 rounded border border-white/10 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{c.nombre}</h3>
                  <p className="text-sm text-gray-300 mt-1">RUC: {(c as any).ruc || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs capitalize ${
                  c.estado === 'activo' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {c.estado}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-sm text-gray-300 mb-3">
                  <span className="text-gray-400">Contacto:</span> {c.contacto}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={()=>openEdit(c)} 
                    className="flex-1 btn btn-ghost text-sm py-2"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={()=>remove(c.id)} 
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


