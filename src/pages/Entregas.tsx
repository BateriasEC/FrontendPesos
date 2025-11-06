import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

type Delivery = { id: number; negociacion: string; fecha: string; grupo: string; cantidad: number; estado: 'pendiente'|'despachado' }

const grupos = [
  'Medianas','Grandes 1:1','Pequeña 1','Pequeña 2','Pequeña 3','Pequeña 4'
]

export default function Entregas() {
  const [negociacion, setNegociacion] = useState('NEG-001')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10))
  const [rows, setRows] = useState<Delivery[]>([])
  const [cliente, setCliente] = useState('')

  const load = async () => { const { data } = await api.get('/deliveries'); setRows(data) }
  useEffect(() => { load() }, [])

  const resumen = useMemo(() => {
    const map = new Map<string, number>()
    rows.filter(r=>r.negociacion===negociacion).forEach(r=> map.set(r.grupo, (map.get(r.grupo)||0)+r.cantidad))
    return grupos.map(g => ({ grupo: g, cantidad: map.get(g) || 0 }))
  }, [rows, negociacion])

  async function agregar(grupo: string) {
    await api.post('/deliveries', { negociacion, fecha, grupo, cantidad: 1, estado: 'pendiente' })
    await load()
  }
  async function despachar(grupo: string) {
    const pendientes = rows.filter(r=>r.negociacion===negociacion && r.grupo===grupo && r.estado==='pendiente')
    if (pendientes[0]) {
      await api.patch(`/deliveries/${pendientes[0].id}`, { estado: 'despachado' })
      await load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm">Negociación</label>
          <input className="input mt-1" value={negociacion} onChange={e=>setNegociacion(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Cliente</label>
          <input className="input mt-1" value={cliente} onChange={e=>setCliente(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Fecha Creación</label>
          <input type="date" className="input mt-1" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {resumen.map(r => (
          <div key={r.grupo} className="rounded border border-white/10 p-3 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.grupo}</div>
              <span className="text-sm text-gray-300">Cant: {r.cantidad}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="btn btn-ghost" onClick={()=>agregar(r.grupo)}>+ Agregar</button>
              <button className="btn btn-primary" onClick={()=>despachar(r.grupo)}>Despachar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


