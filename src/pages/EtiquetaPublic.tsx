import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

// Instancia de axios sin autenticación para endpoints públicos
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 segundos de timeout
})

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

export default function EtiquetaPublic() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [pallet, setPallet] = useState<any>(null)
  const [vehiclePallets, setVehiclePallets] = useState<PalletData[]>([])
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadPalletData()
    }
  }, [id])

  const loadPalletData = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      // Obtener el pallet por ID (endpoint público)
      const response = await publicApi.get(`/pallets/public/${id}`)
      const responseData = response.data?.data || response.data
      
      // El endpoint público devuelve { pallet, vehiclePallets }
      const palletData = responseData.pallet || responseData
      const vehiclePalletsData = responseData.vehiclePallets || []
      
      if (!palletData) {
        setError('Pallet no encontrado')
        return
      }

      // Construir niveles
      const niveles = []
      for (let i = 1; i <= 5; i++) {
        niveles.push({
          nivel: i,
          MED: palletData[`nivel${i}Med`] || 0,
          G1: palletData[`nivel${i}G1`] || 0,
          P1: palletData[`nivel${i}P1`] || 0,
          P2: palletData[`nivel${i}P2`] || 0,
          P3: palletData[`nivel${i}P3`] || 0,
          P4: palletData[`nivel${i}P4`] || 0,
        })
      }

      setPallet({
        ...palletData,
        niveles
      })

      // Mapear los pallets del vehículo que vienen en la respuesta
      const mappedPallets = vehiclePalletsData.map((p: any) => {
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
      
      // Obtener datos del vehículo desde el pallet principal
      if (palletData.vehicle) {
        const v = palletData.vehicle
        setVehicleData({
          placa: v.placa || '',
          cliente: v.cliente || '',
          codigoTrazabilidad: v.codigoTrazabilidad || '',
          pesoIngreso: v.pesoIngreso ? Number(v.pesoIngreso) : null,
          pesoSalida: v.pesoSalida ? Number(v.pesoSalida) : null
        })
      }
    } catch (error: any) {
      console.error('Error cargando datos del pallet:', error)
      setError('Error al cargar los datos del pallet')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !pallet) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4 font-bold">!</div>
          <p className="text-gray-800 text-xl">{error || 'Pallet no encontrado'}</p>
        </div>
      </div>
    )
  }

  const fecha = new Date(pallet.createdAt || pallet.fecha)
  const fechaStr = fecha.toLocaleDateString('es-ES')
  const horaStr = fecha.toLocaleTimeString('es-ES')

  const pesoTotal = Number(pallet.pesoTotal) || 0
  const pesoDescarga = pallet.descargado && pallet.pesoDescarga ? Number(pallet.pesoDescarga) : null
  const variacion = pesoDescarga ? pesoTotal - pesoDescarga : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">BATERÍAS ECUADOR</div>
          <div className="text-sm text-gray-600">Sistema de Control de Pesajes</div>
          <div className="text-xl font-bold mt-3 text-gray-800">INFORMACIÓN COMPLETA DEL PESAJE</div>
        </div>

        {/* Información Principal */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-gray-800 p-4 text-center">
            <div className="text-xs font-bold text-gray-600 mb-2">CÓDIGO DEL PALLET</div>
            <div className="bg-black text-white text-2xl font-bold py-4 px-4 tracking-wider">
              {pallet.codigo}
            </div>
          </div>
          <div className="border-2 border-gray-300 p-4">
            <div className="text-xs font-bold text-gray-600 mb-2">INFORMACIÓN DEL VEHÍCULO</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-bold">Placa:</span>
                <span>{pallet.vehicle?.placa || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Cliente:</span>
                <span>{pallet.vehicle?.cliente || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Trazabilidad:</span>
                <span>{pallet.vehicle?.codigoTrazabilidad || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información General */}
        <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-bold">Fecha:</span>
            <span>{fechaStr}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-bold">Hora:</span>
            <span>{horaStr}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-bold">Producto:</span>
            <span>{pallet.product?.nombre || 'N/A'}</span>
          </div>
        </div>

        {/* Pesos */}
        <div className="space-y-4 mb-6">
          {vehicleData?.pesoIngreso && (
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <span className="font-bold text-lg">Peso Ingreso (Vehículo):</span>
              <span className="text-2xl font-bold text-blue-700">{vehicleData.pesoIngreso.toFixed(2)} kg</span>
            </div>
          )}
          
          <div className="text-center border-2 border-gray-800 p-6 bg-gray-50">
            <div className="text-xs font-bold text-gray-600 mb-2">PESO TOTAL PALLET</div>
            <div className="text-4xl font-bold">{pesoTotal.toFixed(2)} kg</div>
          </div>

          {pesoDescarga && (
            <div className="flex justify-between items-center bg-orange-50 p-4 rounded-lg border border-orange-200">
              <span className="font-bold text-lg">⬇️ Peso Descarga (Pallet):</span>
              <span className="text-2xl font-bold text-orange-700">{pesoDescarga.toFixed(2)} kg</span>
            </div>
          )}

          {variacion !== null && (
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <span className="font-bold text-lg">Variación (Pallet):</span>
              <span className={`text-2xl font-bold ${variacion < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {variacion > 0 ? '+' : ''}{variacion.toFixed(2)} kg
              </span>
            </div>
          )}

          {vehicleData?.pesoSalida && (
            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-lg border border-purple-200">
              <span className="font-bold text-lg">🚪 Peso Salida (Vehículo):</span>
              <span className="text-2xl font-bold text-purple-700">{vehicleData.pesoSalida.toFixed(2)} kg</span>
            </div>
          )}

          {vehicleData?.pesoIngreso && vehicleData?.pesoSalida && (
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <span className="font-bold text-lg">Variación (Vehículo):</span>
              <span className={`text-2xl font-bold ${(vehicleData.pesoIngreso - vehicleData.pesoSalida) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(vehicleData.pesoIngreso - vehicleData.pesoSalida).toFixed(2)} kg
              </span>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="flex justify-between items-center border-t-2 border-dashed border-gray-300 pt-4 mb-6">
          <span className="font-bold text-lg">Estado:</span>
          <span className={`px-6 py-3 rounded font-bold text-lg ${pallet.descargado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {pallet.descargado ? 'DESCARGADO' : 'PENDIENTE'}
          </span>
        </div>

        {/* Tabla de Niveles del Pallet */}
        {pallet.niveles && pallet.niveles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-center">NIVELES DEL PALLET</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-3">NIVEL</th>
                    <th className="border border-gray-300 p-3">MED</th>
                    <th className="border border-gray-300 p-3">G1</th>
                    <th className="border border-gray-300 p-3">P1</th>
                    <th className="border border-gray-300 p-3">P2</th>
                    <th className="border border-gray-300 p-3">P3</th>
                    <th className="border border-gray-300 p-3">P4</th>
                  </tr>
                </thead>
                <tbody>
                  {pallet.niveles.map((n: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 p-3 text-center font-bold">{n.nivel}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.MED}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.G1}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.P1}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.P2}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.P3}</td>
                      <td className="border border-gray-300 p-3 text-center">{n.P4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de Todos los Pallets del Vehículo */}
        {vehiclePallets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-center">TODOS LOS PALLETS DEL VEHÍCULO</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-3">Código</th>
                    <th className="border border-gray-300 p-3">Producto</th>
                    <th className="border border-gray-300 p-3">Peso Total</th>
                    <th className="border border-gray-300 p-3">Peso Descarga</th>
                    <th className="border border-gray-300 p-3">Variación</th>
                    <th className="border border-gray-300 p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclePallets.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-mono font-bold">{p.codigo}</td>
                      <td className="border border-gray-300 p-3">{p.product.nombre}</td>
                      <td className="border border-gray-300 p-3 text-right">{p.pesoTotal.toFixed(2)} kg</td>
                      <td className="border border-gray-300 p-3 text-right">
                        {p.pesoDescarga ? `${p.pesoDescarga.toFixed(2)} kg` : '-'}
                      </td>
                      <td className="border border-gray-300 p-3 text-right">
                        {p.variacionPeso !== null ? (
                          <span className={p.variacionPeso < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                            {p.variacionPeso > 0 ? '+' : ''}{p.variacionPeso.toFixed(2)} kg
                          </span>
                        ) : '-'}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${p.descargado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {p.descargado ? 'DESCARGADO' : 'PENDIENTE'}
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
        <div className="border-t-2 border-dashed border-gray-300 pt-6 text-center text-sm text-gray-500">
          <div>Información generada electrónicamente</div>
          <div>www.bateriasecuador.com</div>
        </div>
      </div>
    </div>
  )
}

