import { useEffect, useState } from 'react'
import { api } from '../services/api'

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

export function useSabanaData(range: { from: string; to: string }) {
  const [sabanasData, setSabanasData] = useState<SabanaData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Obtener pallets del backend filtrados por rango de fechas
        const response = await api.get('/pallets')
        const responseData = response.data?.data || response.data
        let pallets: any[] = []
        
        if (responseData && Array.isArray(responseData.data)) {
          pallets = responseData.data
        } else if (Array.isArray(responseData)) {
          pallets = responseData
        }
        
        // Debug: Ver qué datos recibimos
        if (pallets.length > 0) {
          console.log('[Sabana] Primer pallet recibido:', {
            id: pallets[0].id,
            codigo: pallets[0].codigo,
            pesoTotal: pallets[0].pesoTotal,
            descargado: pallets[0].descargado,
            pesoDescarga: pallets[0].pesoDescarga,
            variacionPeso: pallets[0].variacionPeso
          })
        }
        
        // Filtrar por rango de fechas
        const startDate = new Date(range.from)
        const endDate = new Date(range.to + 'T23:59:59')
        
        const filteredPallets = pallets.filter((p: any) => {
          const fecha = new Date(p.createdAt || p.fecha)
          return fecha >= startDate && fecha <= endDate
        })
        
        // Agrupar por vehículo
        const vehiclesMap = new Map<string, any[]>()
        filteredPallets.forEach((p: any) => {
          const vehicleId = p.vehicleId || p.vehicle?.id
          if (vehicleId) {
            const existing = vehiclesMap.get(vehicleId) || []
            existing.push(p)
            vehiclesMap.set(vehicleId, existing)
          }
        })
        
        // Convertir a formato SabanaData
        const data: SabanaData[] = []
        
        vehiclesMap.forEach((pallets, vehicleId) => {
          if (pallets.length === 0) return
          
          const firstPallet = pallets[0]
          const vehicle = firstPallet.vehicle
          if (!vehicle) return
          
          const pesoIngreso = vehicle.pesoIngreso 
            ? (typeof vehicle.pesoIngreso === 'string' ? parseFloat(vehicle.pesoIngreso) : Number(vehicle.pesoIngreso))
            : 0
          
          const pesoSalida = vehicle.pesoSalida
            ? (typeof vehicle.pesoSalida === 'string' ? parseFloat(vehicle.pesoSalida) : Number(vehicle.pesoSalida))
            : 0
          
          const diferencia = pesoIngreso - pesoSalida
          
          const fecha = new Date(firstPallet.createdAt || firstPallet.fecha)
          const horaIngreso = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          
          // Mapear pallets a formato de paletes y trituradora
          const paletes = pallets.map((p: any, index: number) => {
            const pesoTotal = Number(p.pesoTotal) || 0
            const descargado = p.descargado === true || p.descargado === 'true' || p.descargado === 1
            
            // Convertir pesoDescarga
            let pesoDescarga: number = 0
            if (descargado && p.pesoDescarga) {
              if (typeof p.pesoDescarga === 'string') {
                pesoDescarga = parseFloat(p.pesoDescarga)
              } else {
                pesoDescarga = Number(p.pesoDescarga)
              }
              if (isNaN(pesoDescarga)) pesoDescarga = 0
            }
            
            const variacion = pesoTotal - pesoDescarga
            const pesoTolerado = Math.abs(variacion)
            // Estado: ok si la variación es <= 3kg O si no está descargado (pendiente)
            const estado: 'ok' | 'error' = !descargado || pesoTolerado <= 3 ? 'ok' : 'error'
            
            return {
              numero: index + 1,
              pesoReal: pesoTotal,
              pesoEstimado: pesoTotal, // Usamos el mismo peso como estimado
              pesoTolerado: pesoTolerado,
              estado
            }
          })
          
          const trituradora = pallets.map((p: any, index: number) => {
            const pesoTotal = Number(p.pesoTotal) || 0
            // pesoDescarga puede venir como string (Decimal) o number
            const pesoDescargaRaw = p.pesoDescarga
            const descargado = p.descargado === true || p.descargado === 'true' || p.descargado === 1
            
            // Convertir pesoDescarga correctamente
            let pesoDescarga: number | null = null
            if (pesoDescargaRaw !== null && pesoDescargaRaw !== undefined && pesoDescargaRaw !== '') {
              if (typeof pesoDescargaRaw === 'string') {
                pesoDescarga = parseFloat(pesoDescargaRaw)
              } else {
                pesoDescarga = Number(pesoDescargaRaw)
              }
              // Si la conversión falla, mantener como null
              if (isNaN(pesoDescarga)) {
                pesoDescarga = null
              }
            }
            
            // Si está descargado pero no hay pesoDescarga, usar 0 temporalmente
            const pesoTriturado = descargado && pesoDescarga !== null ? pesoDescarga : (descargado ? 0 : null)
            const diferenciaTrit = pesoTriturado !== null ? pesoTotal - pesoTriturado : pesoTotal
            
            // Estado: ok solo si está descargado Y la diferencia es <= 2kg
            // Si no está descargado, mostrar como pendiente (no error)
            const estado: 'ok' | 'error' = descargado && pesoDescarga !== null
              ? (Math.abs(diferenciaTrit) <= 2 ? 'ok' : 'error')
              : 'ok' // Si no está descargado, no es error, es pendiente
            
            // Debug log para ver qué datos tenemos
            if (index === 0) {
              console.log('[Sabana] Datos del pallet para trituradora:', {
                codigo: p.codigo,
                pesoTotal,
                descargado: p.descargado,
                descargadoBoolean: descargado,
                pesoDescargaRaw,
                pesoDescarga,
                pesoTriturado,
                diferenciaTrit,
                estado
              })
            }
            
            return {
              numero: index + 1,
              pesoPalet: pesoTotal,
              pesoTriturado: pesoTriturado,
              diferencia: diferenciaTrit,
              estado
            }
          })
          
          data.push({
            placa: vehicle.placa || vehicle.codigoTrazabilidad || 'N/A',
            pesoAntes: pesoIngreso,
            pesoDespues: pesoSalida || 0,
            diferencia: diferencia,
            horaIngreso: horaIngreso,
            fecha: fecha.toISOString().slice(0, 10),
            paletes,
            trituradora
          })
        })
        
        setSabanasData(data)
      } catch (error: any) {
        console.error('Error cargando datos de sábanas:', error)
        setSabanasData([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [range.from, range.to])

  return sabanasData
}

