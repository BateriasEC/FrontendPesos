type SabanaData = {
  placa: string
  codigoTrazabilidad: string
  cliente: string
  producto: string
  tipoVehiculo?: string
  pesoAntes: number
  pesoDespues: number
  diferencia: number
  horaIngreso: string
  fecha: string
  paletes: {
    numero: number
    pesoReal: number
    pesoEstimado: number
    pesoTolerado: number
    estado: 'ok' | 'error'
    producto: string
  }[]
  trituradora: {
    numero: number
    pesoPalet: number
    pesoTriturado: number
    diferencia: number
    estado: 'ok' | 'error'
    producto: string
  }[]
}

type Props = {
  data: SabanaData[]
}

const statusStyles = {
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  error: 'bg-red-500/15 text-red-300 border-red-400/30'
}

export function SabanasTable({ data }: Props) {
  return (
    <div className="space-y-6">
      {data.map((camion, idx) => {
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
              </div>

              <div className="text-right text-xs text-gray-400">
                <div>{camion.fecha}</div>
                <div>{camion.horaIngreso}</div>
              </div>
            </div>

            {/* BODY */}
            <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-white/10">
              {/* VEHÍCULO */}
              <section className="p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wide text-gray-300">
                  Pesaje del vehículo
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-800/40 rounded-lg p-3 border border-white/10 hover:border-white/20 transition">
                    <span className="text-xs text-gray-400">Antes</span>
                    <div className="font-semibold text-gray-200">
                      {camion.pesoAntes.toLocaleString()} kg
                    </div>
                  </div>

                  <div className="bg-neutral-800/40 rounded-lg p-3 border border-white/10 hover:border-white/20 transition">
                    <span className="text-xs text-gray-400">Después</span>
                    <div className="font-semibold text-gray-200">
                      {camion.pesoDespues.toLocaleString()} kg
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-800/40 rounded-lg p-3 border border-white/10">
                  <span className="text-xs text-gray-400">Diferencia</span>
                  <div className="text-lg font-bold text-gray-100">
                    {camion.diferencia.toLocaleString()} kg
                  </div>
                </div>
              </section>

              {/* PALETES */}
              <section className="p-4">
                <h4 className="text-xs uppercase tracking-wide text-gray-300 mb-3">
                  Paletes
                </h4>

                <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                  {camion.paletes.map((p, i) => (
                    <div
                      key={i}
                      className="bg-neutral-800/40 rounded-lg p-3 border border-white/10 hover:border-white/20 transition"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-200">
                          Palet {p.numero}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${statusStyles[p.estado]}`}
                        >
                          {p.estado.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 mb-2">
                        {p.producto}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                        <div>Real: {p.pesoReal.toFixed(2)} kg</div>
                        <div>Estimado: {p.pesoEstimado.toFixed(2)} kg</div>
                        <div className="col-span-2">
                          Tolerado: {p.pesoTolerado.toFixed(2)} kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* TRITURADORA */}
              <section className="p-4">
                <h4 className="text-xs uppercase tracking-wide text-gray-300 mb-3">
                  Trituradora
                </h4>

                <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                  {camion.trituradora.map((t, i) => {
                    const pendiente = t.pesoTriturado <= 0

                    return (
                      <div
                        key={i}
                        className="bg-neutral-800/40 rounded-lg p-3 border border-white/10 hover:border-white/20 transition"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200">
                            Palet {t.numero}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${
                              pendiente
                                ? 'bg-gray-500/10 text-gray-300 border-gray-400/20'
                                : statusStyles[t.estado]
                            }`}
                          >
                            {pendiente ? 'Pendiente' : t.estado.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                          <div>Palet: {t.pesoPalet.toFixed(2)} kg</div>
                          <div>
                            Triturado:{' '}
                            {pendiente
                              ? '-'
                              : `${t.pesoTriturado.toFixed(2)} kg`}
                          </div>
                          <div className="col-span-2">
                            Diferencia:{' '}
                            {pendiente
                              ? 'Pendiente'
                              : `${t.diferencia.toFixed(2)} kg`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        )
      })}
    </div>
  )
}
