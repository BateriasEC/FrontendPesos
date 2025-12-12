type SabanaData = {
  placa: string
  pesoAntes: number
  pesoDespues: number
  diferencia: number
  horaIngreso: string
  fecha: string
  paletes: Array<{
    numero: number
    pesoReal: number
    pesoEstimado: number
    pesoTolerado: number
    estado: 'ok' | 'error'
  }>
  trituradora: Array<{
    numero: number
    pesoPalet: number
    pesoTriturado: number
    diferencia: number
    estado: 'ok' | 'error'
  }>
}

type SabanasTableProps = {
  data: SabanaData[]
}

export function SabanasTable({ data }: SabanasTableProps) {
  if (data.length === 0) {
    return (
      <div className=" p-8 text-center text-white/60">
        No hay datos para el rango de fechas seleccionado
      </div>
    )
  }

  return (
    <>
      {/* Vista de tabla para pantallas grandes */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="space-y-4">
          {data.map((camion, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {/* Header del camión */}
              <div className="bg-white/10 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                      <span className="text-2xl">🚛</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Camión {idx + 1}</h3>
                      <p className="text-sm text-white/70">Placa: <span className="font-semibold">{camion.placa}</span></p>
                      <p className="text-sm text-white/70">Cliente: <span className="font-semibold">{camion.cliente || 'N/A'}</span></p>
                      <p className="text-sm text-white/70">Producto: <span className="font-semibold">{camion.producto || 'N/A'}</span></p>
                    </div>
                  </div>
                  <div className="text-right bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                    <div className="text-xs text-white/60 font-medium">Fecha</div>
                    <div className="text-sm font-semibold">
                      {camion.fecha ? (() => {
                        // Si la fecha viene en formato YYYY-MM-DD, convertirla correctamente
                        const fechaParts = camion.fecha.split('-')
                        if (fechaParts.length === 3) {
                          const fechaLocal = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]))
                          return fechaLocal.toLocaleDateString('es-CO', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit',
                            timeZone: 'America/Bogota'
                          })
                        }
                        return new Date(camion.fecha).toLocaleDateString('es-CO', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          timeZone: 'America/Bogota'
                        })
                      })() : 'N/A'}
                    </div>
                    <div className="text-xs text-white/60 mt-1">Hora: <span className="font-semibold">{camion.horaIngreso}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-0">
                {/* Sección CAMIÓN */}
                <div className="bg-white/3 border-r border-white/10 p-5">
                  <h4 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">🚚</span> CAMIÓN
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 mb-1 font-medium">Peso Antes</div>
                      <div className="text-lg font-bold">{camion.pesoAntes.toLocaleString('es-CO')} kg</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 mb-1 font-medium">Peso Después</div>
                      <div className="text-lg font-bold">{camion.pesoDespues.toLocaleString('es-CO')} kg</div>
                    </div>
                    <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                      <div className="text-xs text-green-300 mb-1 font-medium">Diferencia</div>
                      <div className="text-xl font-bold text-green-400">{camion.diferencia.toLocaleString('es-CO')} kg</div>
                    </div>
                  </div>
                </div>

                {/* Sección PALETES */}
                <div className="bg-white/3 border-r border-white/10 p-5">
                  <h4 className="text-sm font-bold text-orange-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">📦</span> PALETES
                  </h4>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {camion.paletes.map((palet, pIdx) => (
                      <div key={pIdx} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">Palet {palet.numero}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            palet.estado === 'ok' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {palet.estado === 'ok' ? '✔ OK' : '✖ Error'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-white/60">Producto: </span>
                          <span className="text-xs font-semibold">{palet.producto || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Real</span>
                            <span className="font-semibold">{palet.pesoReal.toFixed(2)} kg</span>
                          </div>
                          <div className="bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Estimado</span>
                            <span className="font-semibold">{palet.pesoEstimado.toFixed(2)} kg</span>
                          </div>
                          <div className="col-span-2 bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Tolerado</span>
                            <span className={`font-bold ${Math.abs(palet.pesoTolerado) > 3 ? 'text-red-400' : 'text-green-400'}`}>
                              {palet.pesoTolerado.toFixed(2)} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección TRITURADORA */}
                <div className="bg-white/3 p-5">
                  <h4 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">⚙️</span> TRITURADORA
                  </h4>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {camion.trituradora.map((trit, tIdx) => (
                      <div key={tIdx} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">Palet {trit.numero}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            trit.pesoTriturado !== null && trit.pesoTriturado > 0
                              ? (trit.estado === 'ok' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30')
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {trit.pesoTriturado !== null && trit.pesoTriturado > 0
                              ? (trit.estado === 'ok' ? '✔ OK' : '✖ Error')
                              : '⏳ Pendiente'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-white/60">Producto: </span>
                          <span className="text-xs font-semibold">{trit.producto || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Palet</span>
                            <span className="font-semibold">{trit.pesoPalet.toFixed(2)} kg</span>
                          </div>
                          <div className="bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Triturado</span>
                            <span className="font-semibold">
                              {trit.pesoTriturado !== null && trit.pesoTriturado > 0 
                                ? `${trit.pesoTriturado.toFixed(2)} kg` 
                                : '-'}
                            </span>
                          </div>
                          <div className="col-span-2 bg-white/5 rounded p-2 border border-white/10">
                            <span className="text-white/60 block mb-1">Diferencia</span>
                            <span className={`font-bold ${
                              trit.pesoTriturado !== null && trit.pesoTriturado > 0
                                ? (Math.abs(trit.diferencia) > 10 ? 'text-red-400' : 'text-green-400')
                                : 'text-white/60'
                            }`}>
                              {trit.pesoTriturado !== null 
                                ? `${trit.diferencia.toFixed(2)} kg` 
                                : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista de cards para pantallas pequeñas y medianas */}
      <div className="lg:hidden space-y-4">
        {data.map((camion, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {/* Header del camión */}
            <div className="bg-white/10 border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                    <span className="text-xl">🚛</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Camión {idx + 1}</h3>
                    <p className="text-sm text-white/70">Placa: <span className="font-semibold">{camion.placa}</span></p>
                    <p className="text-sm text-white/70">Cliente: <span className="font-semibold">{camion.cliente || 'N/A'}</span></p>
                    <p className="text-sm text-white/70">Producto: <span className="font-semibold">{camion.producto || 'N/A'}</span></p>
                  </div>
                </div>
                <div className="text-right bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                  <div className="text-xs text-white/60 font-medium">Fecha</div>
                  <div className="text-sm font-semibold">
                    {camion.fecha ? (() => {
                      // Si la fecha viene en formato YYYY-MM-DD, convertirla correctamente
                      const fechaParts = camion.fecha.split('-')
                      if (fechaParts.length === 3) {
                        const fechaLocal = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]))
                        return fechaLocal.toLocaleDateString('es-CO', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          timeZone: 'America/Bogota'
                        })
                      }
                      return new Date(camion.fecha).toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit',
                        timeZone: 'America/Bogota'
                      })
                    })() : 'N/A'}
                  </div>
                  <div className="text-xs text-white/60 mt-1">Hora: <span className="font-semibold">{camion.horaIngreso}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Información del camión */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-base">🚚</span> CAMIÓN
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-white/60 mb-1 font-medium">Peso Antes</div>
                    <div className="text-base font-bold">{camion.pesoAntes.toLocaleString('es-CO')} kg</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-white/60 mb-1 font-medium">Peso Después</div>
                    <div className="text-base font-bold">{camion.pesoDespues.toLocaleString('es-CO')} kg</div>
                  </div>
                  <div className="col-span-2 bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-xs text-green-300 mb-1 font-medium">Diferencia</div>
                    <div className="text-lg font-bold text-green-400">{camion.diferencia.toLocaleString('es-CO')} kg</div>
                  </div>
                </div>
              </div>

              {/* Paletes */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-base">📦</span> PALETES
                </h4>
                <div className="space-y-2">
                  {camion.paletes.map((palet, pIdx) => (
                    <div key={pIdx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Palet {palet.numero}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          palet.estado === 'ok' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {palet.estado === 'ok' ? '✔ OK' : '✖ Error'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-white/60">Producto: </span>
                        <span className="text-xs font-semibold">{palet.producto || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Real</span>
                          <span className="font-semibold">{palet.pesoReal.toFixed(2)} kg</span>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Estimado</span>
                          <span className="font-semibold">{palet.pesoEstimado.toFixed(2)} kg</span>
                        </div>
                        <div className="col-span-2 bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Tolerado</span>
                          <span className={`font-bold ${Math.abs(palet.pesoTolerado) > 3 ? 'text-red-400' : 'text-green-400'}`}>
                            {palet.pesoTolerado.toFixed(2)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trituradora */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-base">⚙️</span> TRITURADORA
                </h4>
                <div className="space-y-2">
                  {camion.trituradora.map((trit, tIdx) => (
                    <div key={tIdx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Palet {trit.numero}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trit.pesoTriturado !== null && trit.pesoTriturado > 0
                            ? (trit.estado === 'ok' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30')
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {trit.pesoTriturado !== null && trit.pesoTriturado > 0
                            ? (trit.estado === 'ok' ? '✔ OK' : '✖ Error')
                            : '⏳ Pendiente'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-white/60">Producto: </span>
                        <span className="text-xs font-semibold">{trit.producto || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Palet</span>
                          <span className="font-semibold">{trit.pesoPalet.toFixed(2)} kg</span>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Triturado</span>
                          <span className="font-semibold">
                            {trit.pesoTriturado !== null && trit.pesoTriturado > 0 
                              ? `${trit.pesoTriturado.toFixed(2)} kg` 
                              : '-'}
                          </span>
                        </div>
                        <div className="col-span-2 bg-white/5 rounded p-2">
                          <span className="text-white/60 block mb-1">Diferencia</span>
                          <span className={`font-bold ${
                            trit.pesoTriturado !== null && trit.pesoTriturado > 0
                              ? (Math.abs(trit.diferencia) > 10 ? 'text-red-400' : 'text-green-400')
                              : 'text-white/60'
                          }`}>
                            {trit.pesoTriturado !== null 
                              ? `${trit.diferencia.toFixed(2)} kg` 
                              : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

