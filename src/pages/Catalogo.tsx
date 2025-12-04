import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import * as XLSX from 'xlsx'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'

type Producto = { id: number; codigo: string; nombre: string; tipo: string; pesoEsperado: { G: number; M: number; P: number }; peso?: number; unidadPeso?: string }

export default function Catalogo() {
  const [rows, setRows] = useState<Producto[]>([])
  const [q, setQ] = useState('')
  const load = async () => {
    try {
      const response = await api.get('/products')
      const products = response.data?.data || response.data || []
      setRows(products)
    } catch (error: any) {
      console.error('Error cargando productos:', error)
      setRows([])
    }
  }
  useEffect(() => { load() }, [])
  const filtered = useMemo(() => rows.filter(r => !q || r.nombre.toLowerCase().includes(q.toLowerCase()) || r.codigo.toLowerCase().includes(q.toLowerCase())), [rows, q])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const [editing, setEditing] = useState<Producto | null>(null)
  const [form, setForm] = useState<Omit<Producto, 'id'>>({ codigo: '', nombre: '', tipo: 'Batería', pesoEsperado: { G: 0, M: 0, P: 0 }, peso: 0, unidadPeso: 'kg' })
  const openNew = () => { setEditing({} as any); setForm({ codigo: '', nombre: '', tipo: 'Batería', pesoEsperado: { G: 0, M: 0, P: 0 }, peso: 0, unidadPeso: 'kg' }) }
  const openEdit = (p: Producto) => { 
    setEditing(p); 
    setForm({ 
      codigo: p.codigo, 
      nombre: p.nombre, 
      tipo: p.tipo, 
      pesoEsperado: p.pesoEsperado,
      peso: p.peso || 0,
      unidadPeso: p.unidadPeso || 'kg'
    }) 
  }
  const save = async () => {
    if (editing && (editing as any).id) {
      await api.patch(`/products/${(editing as any).id}`, form)
    } else {
      await api.post(`/products`, form)
    }
    await load()
    setEditing(null)
  }
  const remove = async (id: number) => { await api.delete(`/products/${id}`); await load() }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'productos.xlsx')
  }

  const importExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const items = XLSX.utils.sheet_to_json<any>(sheet)
      for (const it of items) {
        await api.post('/products', {
          codigo: it.codigo || it.Codigo || '',
          nombre: it.nombre || it.Nombre || '',
          tipo: it.tipo || it.Tipo || 'Batería',
          pesoEsperado: { G: Number(it.G) || 0, M: Number(it.M) || 0, P: Number(it.P) || 0 },
        })
      }
      await load()
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Catálogo de Productos</h1>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="mt-1 input" placeholder="Código o nombre" />
        </div>
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
        <button onClick={exportExcel} className="btn btn-ghost">Exportar Excel</button>
        <label className="btn btn-ghost cursor-pointer">
          Importar Excel
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e=> e.target.files && importExcel(e.target.files[0])} />
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="table table-zebra w-full min-w-[700px]">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Peso G/M/P</th>
              <th className="p-2 text-center w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{p.codigo}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.tipo}</td>
                <td className="p-2">{p.pesoEsperado.G} / {p.pesoEsperado.M} / {p.pesoEsperado.P}</td>
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
          <div>
            <label className="block text-sm">Código</label>
            <input value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} className="mt-1 input" />
          </div>
          <div>
            <label className="block text-sm">Nombre</label>
            <input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="mt-1 input" />
          </div>
          <div>
            <label className="block text-sm">Tipo</label>
            <input value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="mt-1 input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">Peso</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="number" 
                step="0.01"
                value={form.peso || 0} 
                onChange={e=>setForm({...form, peso: Number(e.target.value)})} 
                className="input flex-1" 
                placeholder="0"
              />
              <select 
                value={form.unidadPeso || 'kg'} 
                onChange={e=>setForm({...form, unidadPeso: e.target.value})} 
                className="select"
              >
                <option value="g">g (gramos)</option>
                <option value="kg">kg (kilogramos)</option>
                <option value="ton">ton (toneladas)</option>
                <option value="lb">lb (libras)</option>
                <option value="oz">oz (onzas)</option>
              </select>
            </div>
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


