import { useRef } from 'react'
import { exportElementPDF, exportElementPNG, generateZPL } from '../utils/label'

export default function Etiqueta() {
  const ref = useRef<HTMLDivElement>(null)
  const code = '86210-955693'
  return (
    <div className="space-y-3 w-full">
      <h1 className="text-2xl font-bold mb-4">Etiquetas</h1>
      <div className="flex gap-2">
        <button className="btn btn-ghost" onClick={()=> ref.current && exportElementPNG(ref.current)}>Exportar PNG</button>
        <button className="btn btn-ghost" onClick={()=> ref.current && exportElementPDF(ref.current)}>Exportar PDF</button>
        <button className="btn btn-primary" onClick={()=>{
          const zpl = generateZPL({ code, title: 'Impresión Etiqueta' })
          navigator.clipboard.writeText(zpl)
          alert('ZPL copiado al portapapeles (simulación de envío a Zebra).')
        }}>ZPL (copiar)</button>
      </div>
      <div ref={ref} className="bg-white text-black p-6 rounded">
        <h2 className="text-2xl font-bold text-center">Resultado Etiqueta</h2>
        <div className="text-center text-sm mt-1">CODIGO: COD-001-PALLET1</div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2">NIVEL</th>
                <th className="p-2">MEDIANAS</th>
                <th className="p-2">GRANDES 1:1</th>
                <th className="p-2">PEQUEÑA 1</th>
                <th className="p-2">PEQUEÑA 2</th>
                <th className="p-2">PEQUEÑA 3</th>
                <th className="p-2">PEQUEÑA 4</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_,i)=> (
                <tr key={i}>
                  <td className="p-2">NIVEL {i+1}</td>
                  {Array.from({ length: 6 }).map((__,j)=> <td key={j} className="p-2">{Math.floor(Math.random()*35)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


