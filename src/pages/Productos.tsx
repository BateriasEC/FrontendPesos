import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Producto = { id: number; descripcion: string; peso: number; caja: string }

export default function Productos() {
  const [rows, setRows] = useState<Producto[]>([])
  const [editing, setEditing] = useState<Producto | null>(null)
  const [form, setForm] = useState<Omit<Producto,'id'>>({ descripcion: '', peso: 0, caja: '' })
  
  // Filtros por columna
  const [filterDescripcion, setFilterDescripcion] = useState('')
  const [filterPeso, setFilterPeso] = useState('')
  const [filterCaja, setFilterCaja] = useState('')
  
  // Ordenamiento
  const [sortField, setSortField] = useState<keyof Producto | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const load = async () => { 
    try {
      const { data } = await api.get('/productos')
      setRows(data)
    } catch (error) {
      console.error('Error al cargar productos:', error)
      // En caso de que el endpoint no exista aún, usar datos de ejemplo
      setRows([
        { id: 1, descripcion: 'GRANDES 1.2', peso: 31.24, caja: 'GRANDES' },
        { id: 2, descripcion: 'EXTRA GRANDE', peso: 47.93, caja: 'GRANDE' },
        { id: 3, descripcion: 'GRANDES 2', peso: 33.39, caja: '4D/N150' },
        { id: 4, descripcion: 'GRANDES 1.1', peso: 31.24, caja: 'N400' },
        { id: 5, descripcion: 'MEDIANAS 2', peso: 23.18, caja: 'N100' },
        { id: 6, descripcion: 'PEQUEÑA 3', peso: 16.47, caja: '24 / 34' },
        { id: 7, descripcion: 'PEQUEÑA 4', peso: 19.28, caja: 'F65' },
        { id: 8, descripcion: 'MEDIANAS 1', peso: 23.18, caja: '30H / 31' },
        { id: 9, descripcion: 'PEQUEÑA 2.2', peso: 14.78, caja: '66 / 48' },
        { id: 10, descripcion: 'PEQUEÑA 2.1', peso: 14.78, caja: '65 / 25' },
      ])
    }
  }
  
  useEffect(() => { load() }, [])

  const handleSort = (field: keyof Producto) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filtered = useMemo(() => {
    let result = rows.filter(r => {
      const matchDescripcion = !filterDescripcion || r.descripcion.toLowerCase().includes(filterDescripcion.toLowerCase())
      const matchPeso = !filterPeso || r.peso.toString().includes(filterPeso)
      const matchCaja = !filterCaja || r.caja.toLowerCase().includes(filterCaja.toLowerCase())
      return matchDescripcion && matchPeso && matchCaja
    })

    // Aplicar ordenamiento
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [rows, filterDescripcion, filterPeso, filterCaja, sortField, sortDirection])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const openNew = () => { 
    setEditing({} as any)
    setForm({ descripcion: '', peso: 0, caja: '' })
  }
  
  const openEdit = (p: Producto) => { 
    setEditing(p)
    setForm({ descripcion: p.descripcion, peso: p.peso, caja: p.caja })
  }
  
  const save = async () => {
    try {
      if (editing && (editing as any).id) {
        await api.patch(`/productos/${(editing as any).id}`, form)
      } else {
        await api.post(`/productos`, form)
      }
      await load()
      setEditing(null)
    } catch (error) {
      console.error('Error al guardar producto:', error)
      // Simular éxito para desarrollo
      if (editing && (editing as any).id) {
        setRows(rows.map(r => r.id === (editing as any).id ? { ...r, ...form } : r))
      } else {
        const newId = Math.max(...rows.map(r => r.id), 0) + 1
        setRows([...rows, { id: newId, ...form }])
      }
      setEditing(null)
    }
  }
  
  const remove = async (id: number) => { 
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await api.delete(`/productos/${id}`)
        await load()
      } catch (error) {
        console.error('Error al eliminar producto:', error)
        // Simular éxito para desarrollo
        setRows(rows.filter(r => r.id !== id))
      }
    }
  }

  const SortIcon = ({ field }: { field: keyof Producto }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="table table-zebra w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('descripcion')}>
                    Descripción
                    <SortIcon field="descripcion" />
                  </div>
                  <input 
                    className="input input-sm w-full text-xs" 
                    placeholder="Filtrar.." 
                    value={filterDescripcion}
                    onChange={e => { setFilterDescripcion(e.target.value); setPage(1) }}
                  />
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('peso')}>
                    Peso
                    <SortIcon field="peso" />
                  </div>
                  <input 
                    className="input input-sm w-full text-xs" 
                    placeholder="Filtrar.." 
                    value={filterPeso}
                    onChange={e => { setFilterPeso(e.target.value); setPage(1) }}
                  />
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('caja')}>
                    Caja
                    <SortIcon field="caja" />
                  </div>
                  <input 
                    className="input input-sm w-full text-xs" 
                    placeholder="Filtrar.." 
                    value={filterCaja}
                    onChange={e => { setFilterCaja(e.target.value); setPage(1) }}
                  />
                </div>
              </th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{p.descripcion}</td>
                <td className="p-2">{p.peso.toFixed(2)}</td>
                <td className="p-2">{p.caja}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={()=>openEdit(p)} className="text-xs btn btn-ghost w-24">Editar</button>
                    <button onClick={()=>remove(p.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
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

      <Modal open={!!editing} title={(editing && (editing as any).id) ? 'Editar producto' : 'Crear producto'} onClose={()=>setEditing(null)}>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm">Descripción</label>
            <input 
              className="mt-1 input w-full" 
              value={form.descripcion} 
              onChange={e=>setForm({...form, descripcion: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm">Peso</label>
            <input 
              type="number" 
              step="0.01"
              className="mt-1 input w-full" 
              value={form.peso} 
              onChange={e=>setForm({...form, peso: Number(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm">Caja</label>
            <input 
              className="mt-1 input w-full" 
              value={form.caja} 
              onChange={e=>setForm({...form, caja: e.target.value})} 
            />
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

