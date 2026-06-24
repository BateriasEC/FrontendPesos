import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Producto = { id: number; descripcion: string; peso: number; caja: string }

export default function Productos() {
  const [rows, setRows] = useState<Producto[]>([])
  const [editing, setEditing] = useState<Producto | null>(null)
  const [form, setForm] = useState<Omit<Producto,'id'>>({ descripcion: '', peso: 0, caja: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros por columna
  const [filterDescripcion, setFilterDescripcion] = useState('')
  const [filterPeso, setFilterPeso] = useState('')
  const [filterCaja, setFilterCaja] = useState('')
  
  // Ordenamiento
  const [sortField, setSortField] = useState<keyof Producto | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filterDescripcion)
    }, 300)
    return () => clearTimeout(handler)
  }, [filterDescripcion])

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/products', {
        params: {
          page,
          limit: pageSize,
          search: debouncedSearch || undefined,
        }
      })
      const responseData = response.data?.data ?? response.data
      const products = responseData?.data || []
      const totalCount = responseData?.total ?? 0

      const mappedProducts = products.map((p: any) => ({
        id: p.id,
        descripcion: p.nombre || p.descripcion || '',
        weight: Number(p.pesoEsperado || p.peso || 0), // Use same mapping key
        peso: Number(p.pesoEsperado || p.peso || 0),
        caja: p.tipoProducto?.nombre || p.caja || ''
      }))
      setRows(mappedProducts)
      setTotal(totalCount)
    } catch (error: any) {
      console.error('Error al cargar productos:', error)
      setError('Error al cargar productos. Por favor, intente nuevamente.')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])
  
  useEffect(() => { 
    load() 
  }, [load])

  const handleSort = (field: keyof Producto) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const pageRows = useMemo(() => {
    let result = rows.filter(r => {
      const matchPeso = !filterPeso || r.peso.toString().includes(filterPeso)
      const matchCaja = !filterCaja || r.caja.toLowerCase().includes(filterCaja.toLowerCase())
      return matchPeso && matchCaja
    })

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [rows, filterPeso, filterCaja, sortField, sortDirection])

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
        await api.patch(`/products/${(editing as any).id}`, form)
      } else {
        await api.post(`/products`, form)
      }
      await load()
      setEditing(null)
    } catch (error) {
      console.error('Error al guardar producto:', error)
      setEditing(null)
    }
  }
  
  const remove = async (id: number) => { 
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await api.delete(`/products/${id}`)
        await load()
      } catch (error) {
        console.error('Error al eliminar producto:', error)
      }
    }
  }

  const SortIcon = ({ field }: { field: keyof Producto }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <div className="space-y-4 w-full" style={{ minHeight: '400px' }}>
      <h1 className="text-2xl font-bold mb-4 text-white">Volumen de Productos</h1>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded p-3 text-red-300">
          {error}
          <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-end gap-3">
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando productos...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-white/10 bg-black/20">
            <table className="table table-zebra w-full min-w-[600px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-2 text-left text-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('descripcion')}>
                        Descripción
                        <SortIcon field="descripcion" />
                      </div>
                      <input 
                        className="input input-sm w-full text-xs bg-white/10 text-white" 
                        placeholder="Filtrar.." 
                        value={filterDescripcion}
                        onChange={e => { setFilterDescripcion(e.target.value); setPage(1) }}
                      />
                    </div>
                  </th>
                  <th className="p-2 text-left text-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('peso')}>
                        Peso
                        <SortIcon field="peso" />
                      </div>
                      <input 
                        className="input input-sm w-full text-xs bg-white/10 text-white" 
                        placeholder="Filtrar.." 
                        value={filterPeso}
                        onChange={e => { setFilterPeso(e.target.value); setPage(1) }}
                      />
                    </div>
                  </th>
                  <th className="p-2 text-left text-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('caja')}>
                        Caja
                        <SortIcon field="caja" />
                      </div>
                      <input 
                        className="input input-sm w-full text-xs bg-white/10 text-white" 
                        placeholder="Filtrar.." 
                        value={filterCaja}
                        onChange={e => { setFilterCaja(e.target.value); setPage(1) }}
                      />
                    </div>
                  </th>
                  <th className="p-2 text-center w-48 text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      {rows.length === 0 ? 'No hay productos registrados' : 'No hay productos que coincidan con los filtros'}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                      <td className="p-2 text-white">{p.descripcion || '-'}</td>
                      <td className="p-2 text-white">{p.peso.toFixed(2)}</td>
                      <td className="p-2 text-white">{p.caja || '-'}</td>
                      <td className="p-2">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={()=>openEdit(p)} className="text-xs btn btn-ghost w-24">Editar</button>
                          <button onClick={()=>remove(p.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-400">
              {total > 0 ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros` : 'No hay registros'}
            </span>
            <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
          </div>
        </>
      )}

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
