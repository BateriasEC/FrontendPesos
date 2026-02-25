type SabanaPesajesData = {
  placa: string
  codigoTrazabilidad: string
  cliente: string
  producto: string
  tipoVehiculo?: string
  pesoIngreso: number
  pesoSalida: number
  diferencia: number
  horaIngreso: string
  fecha: string
  operador?: string
  pallets: {
    codigoIndependiente: string
    numero: number
    pesoReal: number
    pesoEstimado: number
    pesoTolerado: number
    estadoDespacho: 'despachado' | 'pendiente'
    producto: string
  }[]
}

type Props = {
  data: SabanaPesajesData[]
  searchTerm: string
}

const estadoDespachoStyles = {
  despachado: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-400/30'
}

export function SabanaPesajes({ data, searchTerm }: Props) {
  // Filtrar datos por búsqueda
  const filteredData = data.filter((camion) => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    
    // Buscar en placa, cliente, código de trazabilidad
    if (
      camion.placa.toLowerCase().includes(term) ||
      camion.cliente.toLowerCase().includes(term) ||
      camion.codigoTrazabilidad.toLowerCase().includes(term)
    ) {
      return true
    }
    
    // Buscar en códigos independientes de pallets
    return camion.pallets.some((p) => {
      const codigo = p.codigoIndependiente.toLowerCase()
      // Buscar por código completo o solo por número
      if (codigo.includes(term)) return true
      
      // Extraer número del código (PALL-MESAÑO-N)
      const parts = p.codigoIndependiente.split('-')
      const numero = parts[parts.length - 1]
      return numero === searchTerm
    })
  })

  return (
    <div className="space-y-6">
      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No se encontraron resultados para "{searchTerm}"</p>
        </div>
      ) : (
        filteredData.map((camion, idx) => {
          const labelVehiculo = camion.tipoVehiculo ?? 'Vehículo'

          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-sm"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100">
                    {labelVehiculo} #{idx + 1}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {camion.placa} · {camion.cliente} · {camion.producto}
                  </p>
                  <p className="text-xs text-gray-500">
                    Trazabilidad: {camion.codigoTrazabilidad}
                  </p>
                  {camion.operador && (
                    <p className="text-xs text-gray-500">
                      Operador: {camion.operador}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-400">
                  <div>{camion.fecha}</div>
                  <div>{camion.horaIngreso}</div>
                </div>
              </div>

              {/* BODY */}
              <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/10">
                {/* VEHÍCULO */}
                <section className="p-3 space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-gray-300">
                    Pesaje del Vehículo
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-neutral-800/40 rounded-lg p-2 border border-white/10">
                      <span className="text-xs text-gray-400">Peso Ingreso</span>
                      <div className="text-sm font-semibold text-gray-200">
                        {camion.pesoIngreso.toLocaleString()} kg
                      </div>
                    </div>

                    <div className="bg-neutral-800/40 rounded-lg p-2 border border-white/10">
                      <span className="text-xs text-gray-400">Peso Salida</span>
                      <div className="text-sm font-semibold text-gray-200">
                        {camion.pesoSalida.toLocaleString()} kg
                      </div>
                    </div>

                    <div className="bg-neutral-800/40 rounded-lg p-2 border border-white/10">
                      <span className="text-xs text-gray-400">Diferencia</span>
                      <div className="text-sm font-semibold text-gray-200">
                        {(camion.pesoIngreso - camion.pesoSalida).toLocaleString()} kg
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800/40 rounded-lg p-2 border border-white/10">
                    <span className="text-xs text-gray-400">Peso Total Pallets</span>
                    <div className="text-base font-bold text-gray-100">
                      {camion.pallets.reduce((sum, p) => sum + p.pesoReal, 0).toLocaleString()} kg
                    </div>
                  </div>
                </section>

                {/* PALLETS */}
                <section className="p-3">
                  <h4 className="text-xs uppercase tracking-wide text-gray-300 mb-2">
                    Pallets
                  </h4>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {camion.pallets.map((p, i) => (
                      <div
                        key={i}
                        className="bg-neutral-800/40 rounded-lg p-2 border border-white/10 hover:border-white/20 transition"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <div className="text-sm font-bold text-brand-orange">
                              {p.codigoIndependiente}
                            </div>
                            <div className="text-xs text-gray-400">
                              {p.producto}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${estadoDespachoStyles[p.estadoDespacho]}`}
                          >
                            {p.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                          <div>
                            <span className="text-gray-500">Inicial:</span>
                            <div className="font-medium">{p.pesoReal.toFixed(2)} kg</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Despacho:</span>
                            <div className="font-medium">{p.estadoDespacho === 'despachado' ? `${p.pesoEstimado.toFixed(2)} kg` : 'Pendiente'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Diferencia:</span>
                            <div className="font-medium">{p.estadoDespacho === 'despachado' ? `${(p.pesoReal - p.pesoEstimado).toFixed(2)} kg` : 'Pendiente'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
