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
        <table className=" w-full border-collapse min-w-[1200px]">
          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left border-r border-white/10">CAMIÓN</th>
              <th className="p-3 text-left border-r border-white/10">PALETES</th>
              <th className="p-3 text-left">TRITURADORA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((camion, idx) => (
              <tr key={idx} className="border-b border-white/10">
                <td className="p-4 border-r border-white/10 align-top">
                  <div className="space-y-2">
                    <div><strong>Placa:</strong> {camion.placa}</div>
                    <div><strong>Peso antes:</strong> {camion.pesoAntes.toLocaleString('es-CO')} kg</div>
                    <div><strong>Peso después:</strong> {camion.pesoDespues.toLocaleString('es-CO')} kg</div>
                    <div><strong>Diferencia:</strong> {camion.diferencia.toLocaleString('es-CO')} kg</div>
                    <div><strong>Hora de ingreso:</strong> {camion.horaIngreso}</div>
                    <div className="text-xs text-white/60 mt-2">Fecha: {new Date(camion.fecha).toLocaleDateString('es-CO')}</div>
                  </div>
                </td>
                <td className="p-4 border-r border-white/10 align-top">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="p-2 text-left border-r border-white/10">Palet</th>
                          <th className="p-2 text-left border-r border-white/10">Peso real (kg)</th>
                          <th className="p-2 text-left border-r border-white/10">Peso estimado (kg)</th>
                          <th className="p-2 text-left border-r border-white/10">Peso tolerado (kg)</th>
                          <th className="p-2 text-center border-r border-white/10">Estado</th>
                          <th className="p-2 text-center">Ver más</th>
                        </tr>
                      </thead>
                      <tbody>
                        {camion.paletes.map((palet, pIdx) => (
                          <tr key={pIdx} className={pIdx < camion.paletes.length - 1 ? 'border-b border-white/5' : ''}>
                            <td className="p-2 border-r border-white/10">Palet {palet.numero}</td>
                            <td className="p-2 border-r border-white/10">{palet.pesoReal}</td>
                            <td className="p-2 border-r border-white/10">{palet.pesoEstimado}</td>
                            <td className="p-2 border-r border-white/10">{palet.pesoTolerado} kg</td>
                            <td className="p-2 text-center border-r border-white/10">
                              <span className={palet.estado === 'ok' ? 'text-green-500' : 'text-red-500'}>
                                {palet.estado === 'ok' ? '✔' : '✖'}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <button className="text-xs btn btn-ghost px-2 py-1">Ver más</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="p-2 text-left border-r border-white/10">Palet</th>
                          <th className="p-2 text-left border-r border-white/10">Peso palet (kg)</th>
                          <th className="p-2 text-left border-r border-white/10">Peso triturado (kg)</th>
                          <th className="p-2 text-left border-r border-white/10">Diferencia (kg)</th>
                          <th className="p-2 text-center border-r border-white/10">Estado</th>
                          <th className="p-2 text-center">Ver más</th>
                        </tr>
                      </thead>
                      <tbody>
                        {camion.trituradora.map((trit, tIdx) => (
                          <tr key={tIdx} className={tIdx < camion.trituradora.length - 1 ? 'border-b border-white/5' : ''}>
                            <td className="p-2 border-r border-white/10">Palet {trit.numero}</td>
                            <td className="p-2 border-r border-white/10">{trit.pesoPalet}</td>
                            <td className="p-2 border-r border-white/10">
                              {trit.pesoTriturado !== null && trit.pesoTriturado > 0 
                                ? trit.pesoTriturado.toFixed(1) 
                                : '-'}
                            </td>
                            <td className="p-2 border-r border-white/10">
                              {trit.pesoTriturado !== null 
                                ? `${trit.diferencia.toFixed(1)} kg` 
                                : `${trit.pesoPalet.toFixed(1)} kg`}
                            </td>
                            <td className="p-2 text-center border-r border-white/10">
                              <span className={
                                trit.pesoTriturado !== null && trit.pesoTriturado > 0
                                  ? (trit.estado === 'ok' ? 'text-green-500' : 'text-red-500')
                                  : 'text-yellow-500' // Pendiente
                              }>
                                {trit.pesoTriturado !== null && trit.pesoTriturado > 0
                                  ? (trit.estado === 'ok' ? '✔' : '✖')
                                  : '⏳'} {/* Pendiente */}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <button className="text-xs btn btn-ghost px-2 py-1">Ver más</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para pantallas pequeñas y medianas */}
      <div className="lg:hidden space-y-4">
        {data.map((camion, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
            {/* Información del camión */}
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-semibold text-lg mb-2">Camión {idx + 1}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Placa:</strong> {camion.placa}</div>
                <div><strong>Fecha:</strong> {new Date(camion.fecha).toLocaleDateString('es-CO')}</div>
                <div><strong>Hora ingreso:</strong> {camion.horaIngreso}</div>
                <div><strong>Peso antes:</strong> {camion.pesoAntes.toLocaleString('es-CO')} kg</div>
                <div><strong>Peso después:</strong> {camion.pesoDespues.toLocaleString('es-CO')} kg</div>
                <div><strong>Diferencia:</strong> {camion.diferencia.toLocaleString('es-CO')} kg</div>
              </div>
            </div>

            {/* Paletes */}
            <div>
              <h4 className="font-semibold mb-2 text-base">PALETES</h4>
              <div className="space-y-2">
                {camion.paletes.map((palet, pIdx) => (
                  <div key={pIdx} className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Palet {palet.numero}</span>
                      <span className={palet.estado === 'ok' ? 'text-green-500' : 'text-red-500'}>
                        {palet.estado === 'ok' ? '✔ OK' : '✖ Error'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/60">Peso real:</span> {palet.pesoReal} kg</div>
                      <div><span className="text-white/60">Peso estimado:</span> {palet.pesoEstimado} kg</div>
                      <div className="col-span-2"><span className="text-white/60">Peso tolerado:</span> {palet.pesoTolerado} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trituradora */}
            <div>
              <h4 className="font-semibold mb-2 text-base">TRITURADORA</h4>
              <div className="space-y-2">
                {camion.trituradora.map((trit, tIdx) => (
                  <div key={tIdx} className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Palet {trit.numero}</span>
                      <span className={trit.estado === 'ok' ? 'text-green-500' : 'text-red-500'}>
                        {trit.estado === 'ok' ? '✔ OK' : '✖ Error'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/60">Peso palet:</span> {trit.pesoPalet} kg</div>
                      <div><span className="text-white/60">Peso triturado:</span> {trit.pesoTriturado > 0 ? `${trit.pesoTriturado.toFixed(1)} kg` : 'Pendiente'}</div>
                      <div className="col-span-2"><span className="text-white/60">Diferencia:</span> {trit.diferencia.toFixed(1)} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

