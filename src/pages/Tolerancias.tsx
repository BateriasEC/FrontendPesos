import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'

type Tol = { id: number; familia: string; productoCodigo: string; min: number; max: number }

export default function Tolerancias() {
  const [rows, setRows] = useState<Tol[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Tol | null>(null)
  const [form, setForm] = useState<Omit<Tol,'id'>>({ familia: 'Baterías', productoCodigo: '', min: -2, max: 2 })
  const [minStr, setMinStr] = useState('-2')
  const [maxStr, setMaxStr] = useState('2')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/tolerances')
      const tolerances = response.data?.data || response.data || []
      setRows(tolerances)
    } catch (error: any) {
      console.error('Error cargando tolerancias:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter(r => !q || r.familia.toLowerCase().includes(q.toLowerCase()) || r.productoCodigo.toLowerCase().includes(q.toLowerCase())), [rows, q])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const openNew = () => {
    setEditing({} as any)
    setForm({ familia: 'Baterías', productoCodigo: '', min: -2, max: 2 })
    setMinStr('-2')
    setMaxStr('2')
  }
  const openEdit = (t: Tol) => {
    setEditing(t)
    setForm({ familia: t.familia, productoCodigo: t.productoCodigo, min: t.min, max: t.max })
    setMinStr(String(t.min))
    setMaxStr(String(t.max))
  }
  const save = async () => {
    const parseNum = (s: string, fallback: number) => {
      const x = s.trim().replace(',', '.')
      if (x === '' || x === '-' || x === '+') return fallback
      const n = Number(x)
      return Number.isFinite(n) ? n : fallback
    }
    const payload = {
      ...form,
      min: parseNum(minStr, form.min),
      max: parseNum(maxStr, form.max),
    }
    if (editing && (editing as any).id) await api.patch(`/tolerances/${(editing as any).id}`, payload)
    else await api.post(`/tolerances`, payload)
    await load(); setEditing(null)
  }
  const remove = async (id: number) => { await api.delete(`/tolerances/${id}`); await load() }

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Tolerancias</h1>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm">Buscar</label>
          <input className="mt-1 input" placeholder="Familia o código" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <button onClick={openNew} className="ml-auto btn btn-primary">Nuevo</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] bg-white/5 rounded border border-white/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando tolerancias...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-white/10">
          <table className="table table-zebra w-full min-w-[600px]">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 text-left">Familia</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-left">Mín (kg)</th>
                <th className="p-2 text-left">Máx (kg)</th>
                <th className="p-2 text-center w-48">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{t.familia}</td>
                <td className="p-2">{t.productoCodigo}</td>
                <td className="p-2">{t.min}</td>
                <td className="p-2">{t.max}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={()=>openEdit(t)} className="text-xs btn btn-ghost w-24">Editar</button>
                    <button onClick={()=>remove(t.id)} className="text-xs btn w-24 bg-red-500/20 text-red-300 hover:bg-red-500/30">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </div>
      )}

      <Modal open={!!editing} title={(editing && (editing as any).id) ? 'Editar tolerancia' : 'Crear tolerancia'} onClose={()=>setEditing(null)}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Familia</label>
            <input className="mt-1 input" value={form.familia} onChange={e=>setForm({...form, familia: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Producto (código)</label>
            <input className="mt-1 input" value={form.productoCodigo} onChange={e=>setForm({...form, productoCodigo: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Mín (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              className="mt-1 input"
              value={minStr}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9+\-.]/g, '')
                setMinStr(v)
              }}
            />
          </div>
          <div>
            <label className="block text-sm">Máx (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              className="mt-1 input"
              value={maxStr}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9+\-.]/g, '')
                setMaxStr(v)
              }}
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


