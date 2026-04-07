import { useMemo, useState } from 'react'

export default function Repesos() {
  const [codigo, setCodigo] = useState('COD-001-P1')
  const [pesoInicial, setPesoInicial] = useState<number>(180)
  const [pesoActual, setPesoActual] = useState<number>(130)
  const [minTol, setMinTol] = useState<number>(-5)
  const [maxTol, setMaxTol] = useState<number>(5)

  const variacion = useMemo(() => Number((pesoActual - pesoInicial).toFixed(2)), [pesoInicial, pesoActual])
  const dentro = variacion >= minTol && variacion <= maxTol

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Re-pesos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm">Código Pallet</label>
          <input className="mt-1 input" value={codigo} onChange={e=>setCodigo(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Peso inicial (kg)</label>
          <input type="number" className="mt-1 input" value={pesoInicial} onChange={e=>setPesoInicial(Number(e.target.value)||0)} />
        </div>
        <div>
          <label className="block text-sm">Peso actual (kg)</label>
          <input type="number" className="mt-1 input" value={pesoActual} onChange={e=>setPesoActual(Number(e.target.value)||0)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm">Tol. mín (kg)</label>
            <input type="number" className="mt-1 input" value={minTol} onChange={e=>setMinTol(Number(e.target.value)||0)} />
          </div>
          <div>
            <label className="block text-sm">Tol. máx (kg)</label>
            <input type="number" className="mt-1 input" value={maxTol} onChange={e=>setMaxTol(Number(e.target.value)||0)} />
          </div>
        </div>
      </div>

      <div className={(dentro ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30') + ' rounded border p-4'}>
        <div className="text-sm text-gray-300">Variación</div>
        <div className="text-2xl font-semibold">{variacion} kg {dentro ? '(OK)' : '(AVISO)'}</div>
        <div className="text-sm mt-2">Rango permitido: {minTol} … {maxTol} kg</div>
      </div>
    </div>
  )
}


