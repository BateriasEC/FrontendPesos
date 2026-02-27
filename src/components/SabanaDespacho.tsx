type SabanaDespachoData = {
  codigoIndependiente: string
  placa: string
  cliente: string
  producto: string
  pesoDespacho: number
  fechaDespacho: string
  horaDespacho: string
  variacion: number
  estadoDespacho: 'completado' | 'pendiente'
  pesoOriginal: number
  operador?: string
}

type Props = {
  data: SabanaDespachoData[]
  searchTerm: string
}

const estadoStyles = {
  completado: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-400/30'
}

export function SabanaDespacho({ data, searchTerm }: Props) {
  // Filtrar datos por búsqueda
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    
    // Buscar en placa, cliente, código independiente
    if (
      item.placa.toLowerCase().includes(term) ||
      item.cliente.toLowerCase().includes(term) ||
      item.codigoIndependiente.toLowerCase().includes(term)
    ) {
      return true
    }
    
    // Buscar por número del pallet
    const parts = item.codigoIndependiente.split('-')
    const numero = parts[parts.length - 1]
    return numero === searchTerm
  })

  return (
    <div className="space-y-4">
      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No se encontraron resultados para "{searchTerm}"</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Código Pallet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Placa</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Operador</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Peso Original</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Peso Despacho</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Variación</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-orange">
                      {item.codigoIndependiente}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-100">
                    {item.placa}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.cliente}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.producto}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.operador || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.pesoOriginal.toFixed(2)} kg
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {item.estadoDespacho === 'completado' 
                      ? `${item.pesoDespacho.toFixed(2)} kg`
                      : '-'
                    }
                  </td>
                  <td className="py-3 px-4">
                    <span className={item.variacion > 10 ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                      {item.estadoDespacho === 'completado'
                        ? `${item.variacion.toFixed(2)} kg`
                        : '-'
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {item.estadoDespacho === 'completado' ? (
                      <>
                        <div>{item.fechaDespacho}</div>
                        <div>{item.horaDespacho}</div>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${estadoStyles[item.estadoDespacho]}`}
                    >
                      {item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
