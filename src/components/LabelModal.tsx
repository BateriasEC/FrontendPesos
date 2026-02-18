type LabelData = {
  id: string
  codigoPallet: string
  placa: string
  codigoTrazabilidad: string
  fecha: string
  productNombre: string
  pesoTotal: number
  pesoDescarga: number | null
  variacionPallet: number | null
  descargado: boolean
}

type LabelModalProps = {
  labelData: LabelData | null
  onClose: () => void
}

export function LabelModal({ labelData, onClose }: LabelModalProps) {
  if (!labelData) return null

  const fecha = new Date(labelData.fecha)
  const fechaStr = fecha.toLocaleDateString('es-ES')
  const horaStr = fecha.toLocaleTimeString('es-ES')
  
  // Calcular variación porcentual del pallet si hay peso de descarga
  const variacionPorcentual = labelData.pesoDescarga && labelData.pesoTotal > 0
    ? ((labelData.pesoDescarga - labelData.pesoTotal) / labelData.pesoTotal) * 100
    : null

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
          }
          body > *:not(.print-wrapper) {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-wrapper {
            display: block !important;
            position: static !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .print-content {
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 10px !important;
            position: static !important;
            width: 100% !important;
          }
          .print-content .text-3xl {
            font-size: 1.5rem !important;
          }
          .print-content .text-4xl {
            font-size: 2rem !important;
          }
          .print-content .text-xl {
            font-size: 1rem !important;
          }
          .print-content .text-2xl {
            font-size: 1.25rem !important;
          }
          .print-content .space-y-6 > * + * {
            margin-top: 0.75rem !important;
          }
          .print-content .space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
          .print-content .p-6 {
            padding: 0.75rem !important;
          }
          .print-content .p-4 {
            padding: 0.5rem !important;
          }
          .print-content .pb-4 {
            padding-bottom: 0.5rem !important;
          }
          .print-content .pt-4 {
            padding-top: 0.5rem !important;
          }
          .print-content .pt-6 {
            padding-top: 0.75rem !important;
          }
          .print-content .mb-2 {
            margin-bottom: 0.25rem !important;
          }
          .print-content .mb-3 {
            margin-bottom: 0.375rem !important;
          }
          .print-content .mb-4 {
            margin-bottom: 0.5rem !important;
          }
          .print-content .mt-6 {
            margin-top: 0.75rem !important;
          }
          .print-content table {
            page-break-inside: avoid;
            border-collapse: collapse !important;
            font-size: 0.75rem !important;
          }
          .print-content table th,
          .print-content table td {
            padding: 0.375rem !important;
          }
          .print-content .text-base {
            font-size: 0.875rem !important;
          }
          .print-content h3 {
            page-break-after: avoid;
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .print-content .gap-6 {
            gap: 0.75rem !important;
          }
          .print-content .gap-4 {
            gap: 0.5rem !important;
          }
          .print-content .rounded-lg {
            border-radius: 0.25rem !important;
          }
          .print-content .border-2 {
            border-width: 1px !important;
          }
          .print-content .border-4 {
            border-width: 2px !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 no-print print-wrapper">
        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto print-wrapper">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center no-print">
            <h2 className="text-2xl font-bold text-gray-800">Reporte de Pallet</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 print-content">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">BATERÍAS ECUADOR</div>
                <div className="text-sm text-gray-600">Sistema de Control de Pesajes</div>
                <div className="text-lg font-bold mt-2 text-gray-800">REPORTE DE PALLET</div>
              </div>

              {/* Código del Pallet - Destacado */}
              <div className="border-4 border-gray-900 p-6 text-center bg-gray-50">
                <div className="text-sm font-bold text-gray-600 mb-2">CÓDIGO DEL PALLET</div>
                <div className="text-4xl font-bold text-gray-900 tracking-wider font-mono">
                  {labelData.codigoPallet}
                </div>
              </div>

              {/* Información General */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                  📋 Información General
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-base">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-700">Fecha:</span>
                    <span className="text-gray-900 font-semibold">{fechaStr}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-700">Hora:</span>
                    <span className="text-gray-900 font-semibold">{horaStr}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-700">Placa Vehículo:</span>
                    <span className="text-gray-900 font-semibold">{labelData.placa || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-700">Código Trazabilidad:</span>
                    <span className="text-gray-900 font-semibold">{labelData.codigoTrazabilidad || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2 md:col-span-2">
                    <span className="font-bold text-gray-700">Producto:</span>
                    <span className="text-gray-900 font-semibold">{labelData.productNombre || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Información de Pesajes */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                  ⚖️ Datos de Pesaje
                </h3>
                
                {/* Peso del Pallet (Original) */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Peso del Pallet (Original):</span>
                    <span className="text-2xl font-bold text-blue-900">{labelData.pesoTotal.toFixed(2)} kg</span>
                  </div>
                </div>

                {/* Peso de Despacho */}
                {labelData.pesoDescarga ? (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-900">Peso de Despacho:</span>
                      <span className="text-2xl font-bold text-orange-900">{labelData.pesoDescarga.toFixed(2)} kg</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-700">Peso de Despacho:</span>
                      <span className="text-xl font-semibold text-gray-500">Pendiente</span>
                    </div>
                  </div>
                )}

                {/* Variación del Pallet */}
                {labelData.variacionPallet !== null && labelData.variacionPallet !== undefined && labelData.pesoDescarga && (
                  <div className={`border-2 rounded-lg p-4 ${
                    Math.abs(labelData.variacionPallet) > (labelData.pesoTotal * 0.005)
                      ? 'bg-red-50 border-red-400'
                      : 'bg-green-50 border-green-400'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">Variación del Pallet:</span>
                        <span className={`text-2xl font-bold ${
                          labelData.variacionPallet < 0 ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {labelData.variacionPallet > 0 ? '+' : ''}{labelData.variacionPallet.toFixed(2)} kg
                        </span>
                      </div>
                      {variacionPorcentual !== null && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-700">Variación Porcentual:</span>
                          <span className={`font-bold ${
                            Math.abs(variacionPorcentual) > 0.5 ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {variacionPorcentual > 0 ? '+' : ''}{variacionPorcentual.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      {variacionPorcentual !== null && Math.abs(variacionPorcentual) > 0.5 && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm">
                          <span className="font-bold text-red-800">⚠️ ALERTA:</span>
                          <span className="text-red-700"> La variación supera el ±0.5% permitido</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Estado del Pallet */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl text-gray-900">Estado del Pallet:</span>
                  <span className={`px-6 py-3 rounded-lg font-bold text-lg ${
                    labelData.descargado 
                      ? 'bg-green-200 text-green-900 border-2 border-green-500' 
                      : 'bg-yellow-200 text-yellow-900 border-2 border-yellow-500'
                  }`}>
                    {labelData.descargado ? '✅ DESPACHADO' : '⏳ PENDIENTE'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
                <div className="font-semibold">Reporte generado electrónicamente</div>
                <div className="text-xs mt-1">www.bateriasecuador.com</div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-4 justify-center pt-4 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

