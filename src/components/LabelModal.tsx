import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../services/api'

type PalletData = {
  id: string
  codigo: string
  pesoTotal: number
  pesoDescarga: number | null
  variacionPeso: number | null
  descargado: boolean
  product: {
    nombre: string
    codigo: string
  }
  niveles: Array<{
    nivel: number
    MED: number
    G1: number
    P1: number
    P2: number
    P3: number
    P4: number
  }>
}

type VehicleData = {
  placa: string
  cliente: string
  codigoTrazabilidad: string
  pesoIngreso: number | null
  pesoSalida: number | null
}

type LabelData = {
  id: string
  codigoPallet: string
  placa: string
  cliente: string
  codigoTrazabilidad: string
  fecha: string
  productNombre: string
  pesoIngreso: number
  pesoSalida: number | null
  pesoTotal: number
  pesoDescarga: number | null
  variacionPallet: number | null
  variacionVehiculo: number
  descargado: boolean
  vehicleId: string
  niveles?: Array<{
    nivel: number
    MED: number
    G1: number
    P1: number
    P2: number
    P3: number
    P4: number
  }>
}

type LabelModalProps = {
  labelData: LabelData | null
  onClose: () => void
}

export function LabelModal({ labelData, onClose }: LabelModalProps) {
  const [vehiclePallets, setVehiclePallets] = useState<PalletData[]>([])
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)

  useEffect(() => {
    if (labelData?.vehicleId) {
      loadVehicleData()
    }
  }, [labelData])

  const loadVehicleData = async () => {
    if (!labelData?.vehicleId) return
    
    setLoading(true)
    try {
      // Obtener todos los pallets del vehículo
      const response = await api.get(`/pallets/vehicle/${labelData.vehicleId}`)
      const pallets = response.data?.data || response.data || []
      
      // Mapear pallets con niveles
      const mappedPallets = pallets.map((p: any) => {
        const niveles = []
        for (let i = 1; i <= 5; i++) {
          niveles.push({
            nivel: i,
            MED: p[`nivel${i}Med`] || 0,
            G1: p[`nivel${i}G1`] || 0,
            P1: p[`nivel${i}P1`] || 0,
            P2: p[`nivel${i}P2`] || 0,
            P3: p[`nivel${i}P3`] || 0,
            P4: p[`nivel${i}P4`] || 0,
          })
        }
        
        return {
          id: p.id,
          codigo: p.codigo,
          pesoTotal: Number(p.pesoTotal) || 0,
          pesoDescarga: p.descargado && p.pesoDescarga ? Number(p.pesoDescarga) : null,
          variacionPeso: p.variacionPeso ? Number(p.variacionPeso) : null,
          descargado: p.descargado === true || p.descargado === 1,
          product: {
            nombre: p.product?.nombre || '',
            codigo: p.product?.codigo || ''
          },
          niveles
        }
      })
      
      setVehiclePallets(mappedPallets)
      
      // Obtener datos del vehículo si están disponibles en el primer pallet
      if (pallets.length > 0 && pallets[0].vehicle) {
        const v = pallets[0].vehicle
        setVehicleData({
          placa: v.placa || '',
          cliente: v.cliente || '',
          codigoTrazabilidad: v.codigoTrazabilidad || '',
          pesoIngreso: v.pesoIngreso ? Number(v.pesoIngreso) : null,
          pesoSalida: v.pesoSalida ? Number(v.pesoSalida) : null
        })
      }
    } catch (error: any) {
      console.error('Error cargando datos del vehículo:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!labelData) return null

  // Generar URL única para el QR
  const qrUrl = `${window.location.origin}/etiqueta/${labelData.id}`

  const fecha = new Date(labelData.fecha)
  const fechaStr = fecha.toLocaleDateString('es-ES')
  const horaStr = fecha.toLocaleTimeString('es-ES')

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
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print-wrapper">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center no-print">
            <h2 className="text-2xl font-bold text-gray-800">Etiqueta de Pesaje</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 print-content">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">BATERÍAS ECUADOR</div>
                <div className="text-sm text-gray-600">Sistema de Control de Pesajes</div>
                <div className="text-lg font-bold mt-2 text-gray-800">TICKET DE PESAJE</div>
              </div>

              {/* Código y QR */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-gray-800 p-4 text-center">
                  <div className="text-xs font-bold text-gray-600 mb-2">CÓDIGO DEL PALLET</div>
                  <div className="bg-black text-white text-xl font-bold py-3 px-4 tracking-wider">
                    {labelData.codigoPallet}
                  </div>
                </div>
                <div className="border-2 border-gray-300 p-4 text-center">
                  <div className="text-xs font-bold text-gray-600 mb-2">CÓDIGO QR</div>
                  <div className="flex justify-center">
                    <QRCodeSVG value={qrUrl} size={150} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Escanea para ver detalles</div>
                </div>
              </div>

              {/* Información del Vehículo */}
              <div className="grid md:grid-cols-2 gap-4 text-base">
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Trazabilidad:</span>
                  <span className="text-gray-800 font-semibold">{labelData.codigoTrazabilidad || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Fecha:</span>
                  <span className="text-gray-800 font-semibold">{fechaStr}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Hora:</span>
                  <span className="text-gray-800 font-semibold">{horaStr}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Placa:</span>
                  <span className="text-gray-800 font-semibold">{labelData.placa || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Cliente:</span>
                  <span className="text-gray-800 font-semibold">{labelData.cliente || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b-2 border-gray-300 pb-3">
                  <span className="font-bold text-gray-900">Producto:</span>
                  <span className="text-gray-800 font-semibold">{labelData.productNombre || 'N/A'}</span>
                </div>
              </div>

              {/* Pesos */}
              <div className="space-y-4">
                {vehicleData?.pesoIngreso && (
                  <div className="flex justify-between items-center bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                    <span className="font-bold text-base text-gray-900">⚖️ Peso Ingreso (Vehículo):</span>
                    <span className="text-xl font-bold text-blue-900">{vehicleData.pesoIngreso.toFixed(2)} kg</span>
                  </div>
                )}
                
                <div className="text-center border-4 border-gray-900 p-6 bg-gray-50">
                  <div className="text-sm font-bold text-gray-700 mb-3">PESO TOTAL PALLET</div>
                  <div className="text-4xl font-bold text-gray-900">{labelData.pesoTotal.toFixed(2)} kg</div>
                </div>

                {labelData.pesoDescarga && (
                  <div className="flex justify-between items-center bg-orange-100 p-4 rounded-lg border-2 border-orange-300">
                    <span className="font-bold text-base text-gray-900">⬇️ Peso Descarga (Pallet):</span>
                    <span className="text-xl font-bold text-orange-900">{labelData.pesoDescarga.toFixed(2)} kg</span>
                  </div>
                )}

                {labelData.variacionPallet !== null && labelData.variacionPallet !== undefined && labelData.pesoDescarga && (
                  <div className="flex justify-between items-center bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
                    <span className="font-bold text-base text-gray-900">📊 Variación (Pallet):</span>
                    <span className={`text-xl font-bold ${labelData.variacionPallet < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {labelData.variacionPallet > 0 ? '+' : ''}{labelData.variacionPallet.toFixed(2)} kg
                    </span>
                  </div>
                )}

                {vehicleData?.pesoSalida && (
                  <div className="flex justify-between items-center bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                    <span className="font-bold text-base text-gray-900">🚪 Peso Salida (Vehículo):</span>
                    <span className="text-xl font-bold text-purple-900">{vehicleData.pesoSalida.toFixed(2)} kg</span>
                  </div>
                )}

                {labelData.variacionVehiculo !== undefined && labelData.variacionVehiculo !== null && (
                  <div className="flex justify-between items-center bg-indigo-100 p-4 rounded-lg border-2 border-indigo-300">
                    <span className="font-bold text-base text-gray-900">📊 Variación (Vehículo):</span>
                    <span className={`text-xl font-bold ${labelData.variacionVehiculo < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {labelData.variacionVehiculo > 0 ? '+' : ''}{labelData.variacionVehiculo.toFixed(2)} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="flex justify-between items-center border-t-2 border-dashed border-gray-400 pt-4">
                <span className="font-bold text-lg text-gray-900">Estado:</span>
                <span className={`px-6 py-3 rounded-lg font-bold text-base ${labelData.descargado ? 'bg-green-200 text-green-900 border-2 border-green-400' : 'bg-yellow-200 text-yellow-900 border-2 border-yellow-400'}`}>
                  {labelData.descargado ? 'DESCARGADO' : 'PENDIENTE'}
                </span>
              </div>

              {/* Tabla de Pallets del Vehículo */}
              {vehiclePallets.length > 0 && (
                <div className="mt-6 border-t-2 border-gray-400 pt-6">
                  <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">PALLETS DEL VEHÍCULO</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-base border-collapse border-2 border-gray-400">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border-2 border-gray-400 p-3 text-left font-bold text-gray-900">Código</th>
                          <th className="border-2 border-gray-400 p-3 text-left font-bold text-gray-900">Producto</th>
                          <th className="border-2 border-gray-400 p-3 text-right font-bold text-gray-900">Peso Total</th>
                          <th className="border-2 border-gray-400 p-3 text-right font-bold text-gray-900">Peso Descarga</th>
                          <th className="border-2 border-gray-400 p-3 text-right font-bold text-gray-900">Variación</th>
                          <th className="border-2 border-gray-400 p-3 text-center font-bold text-gray-900">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehiclePallets.map((pallet) => (
                          <tr key={pallet.id} className="hover:bg-gray-100">
                            <td className="border-2 border-gray-400 p-3 font-mono font-semibold text-gray-900">{pallet.codigo}</td>
                            <td className="border-2 border-gray-400 p-3 font-semibold text-gray-800">{pallet.product.nombre}</td>
                            <td className="border-2 border-gray-400 p-3 text-right font-semibold text-gray-900">{pallet.pesoTotal.toFixed(2)} kg</td>
                            <td className="border-2 border-gray-400 p-3 text-right font-semibold text-gray-900">
                              {pallet.pesoDescarga ? `${pallet.pesoDescarga.toFixed(2)} kg` : '-'}
                            </td>
                            <td className="border-2 border-gray-400 p-3 text-right font-semibold">
                              {pallet.variacionPeso !== null ? (
                                <span className={pallet.variacionPeso < 0 ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                                  {pallet.variacionPeso > 0 ? '+' : ''}{pallet.variacionPeso.toFixed(2)} kg
                                </span>
                              ) : '-'}
                            </td>
                            <td className="border-2 border-gray-400 p-3 text-center">
                              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${pallet.descargado ? 'bg-green-200 text-green-900 border-2 border-green-400' : 'bg-yellow-200 text-yellow-900 border-2 border-yellow-400'}`}>
                                {pallet.descargado ? 'DESCARGADO' : 'PENDIENTE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-dashed border-gray-400 pt-4 text-center text-sm text-gray-700 font-semibold">
                <div>Ticket generado electrónicamente</div>
                <div>www.bateriasecuador.com</div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-4 justify-center pt-4 no-print">
                <button
                  onClick={() => {
                    // Ocultar el overlay y mostrar solo el contenido para imprimir
                    const printContent = document.querySelector('.print-content')
                    if (printContent) {
                      const printWindow = window.open('', '_blank')
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Etiqueta de Pesaje</title>
                              <style>
                                @page {
                                  size: A4;
                                  margin: 0.5cm;
                                }
                                body {
                                  font-family: Arial, sans-serif;
                                  background: white;
                                  padding: 10px;
                                }
                                .text-3xl { font-size: 1.5rem !important; }
                                .text-4xl { font-size: 2rem !important; }
                                .text-xl { font-size: 1rem !important; }
                                .text-2xl { font-size: 1.25rem !important; }
                                .space-y-6 > * + * { margin-top: 0.75rem !important; }
                                .space-y-4 > * + * { margin-top: 0.5rem !important; }
                                .p-6 { padding: 0.75rem !important; }
                                .p-4 { padding: 0.5rem !important; }
                                .pb-4 { padding-bottom: 0.5rem !important; }
                                .pt-4 { padding-top: 0.5rem !important; }
                                .pt-6 { padding-top: 0.75rem !important; }
                                .mb-2 { margin-bottom: 0.25rem !important; }
                                .mb-3 { margin-bottom: 0.375rem !important; }
                                .mb-4 { margin-bottom: 0.5rem !important; }
                                .mt-6 { margin-top: 0.75rem !important; }
                                table { page-break-inside: avoid; border-collapse: collapse !important; font-size: 0.75rem !important; }
                                table th, table td { padding: 0.375rem !important; }
                                .text-base { font-size: 0.875rem !important; }
                                h3 { page-break-after: avoid; font-size: 1rem !important; margin-bottom: 0.5rem !important; }
                                .gap-6 { gap: 0.75rem !important; }
                                .gap-4 { gap: 0.5rem !important; }
                                .rounded-lg { border-radius: 0.25rem !important; }
                                .border-2 { border-width: 1px !important; }
                                .border-4 { border-width: 2px !important; }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `)
                        printWindow.document.close()
                        printWindow.onload = () => {
                          printWindow.print()
                          printWindow.close()
                        }
                      }
                    } else {
                      window.print()
                    }
                  }}
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
          )}
          </div>
        </div>
      </div>
    </>
  )
}

