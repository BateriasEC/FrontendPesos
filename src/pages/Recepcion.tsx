import { useState } from 'react'

type Nivel = { nivel: number; MED: number; G1: number; P1: number; P2: number; P3: number; P4: number }

export default function Recepcion() {
  const [negociacion, setNegociacion] = useState('NEG-001')
  const [pallet, setPallet] = useState('86210-955693')
  const [niveles, setNiveles] = useState<Nivel[]>([
    { nivel: 1, MED: 2, G1: 13, P1: 8, P2: 14, P3: 20, P4: 6 },
  ])
  const [, setGuia] = useState<File | null>(null)

  const addNivel = () => setNiveles(prev => [...prev, { nivel: prev.length + 1, MED: 0, G1: 0, P1: 0, P2: 0, P3: 0, P4: 0 }])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Recepción registrada (mock). Adjuntos guardados localmente.')
  }

  return (
    <form onSubmit={submit} className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Recepción de Baterías</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm">Negociación</label>
          <input value={negociacion} onChange={e=>setNegociacion(e.target.value)} className="mt-1 input" />
        </div>
        <div>
          <label className="block text-sm">Código Pallet</label>
          <input value={pallet} onChange={e=>setPallet(e.target.value)} className="mt-1 input" />
        </div>
        <div>
          <label className="block text-sm">Guía remisión (PDF)</label>
          <input type="file" accept="application/pdf" onChange={e=>setGuia(e.target.files?.[0] || null)} className="mt-1" />
        </div>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2">NIVEL</th>
              <th className="p-2">MED</th>
              <th className="p-2">G1</th>
              <th className="p-2">P1</th>
              <th className="p-2">P2</th>
              <th className="p-2">P3</th>
              <th className="p-2">P4</th>
            </tr>
          </thead>
          <tbody>
            {niveles.map((n, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white/5' : ''}>
                <td className="p-2">{n.nivel}</td>
                {(['MED','G1','P1','P2','P3','P4'] as const).map((k) => (
                  <td className="p-2" key={k}>
                    <input
                      type="number"
                      className="input w-24"
                      value={(n as any)[k]}
                      onChange={e=>{
                        const val = Number(e.target.value)
                        setNiveles(prev => prev.map((x,i)=> i===idx ? { ...x, [k]: val } : x))
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addNivel} className="px-3 py-2 bg-white/10 rounded">Agregar nivel</button>
        <button type="submit" className="px-3 py-2 bg-brand-orange text-black rounded">Registrar recepción</button>
      </div>
    </form>
  )
}


