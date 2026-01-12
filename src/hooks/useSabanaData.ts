import { useEffect, useState } from 'react'
import { api } from '../services/api'

type SabanaData = {
  placa: string
  codigoTrazabilidad: string
  cliente: string
  producto: string
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
    producto: string
  }>
  trituradora: Array<{
    numero: number
    pesoPalet: number
    pesoTriturado: number
    diferencia: number
    estado: 'ok' | 'error'
    producto: string
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
        
        console.log('[Sabana] Total pallets recibidos:', pallets.length)
        
        // Debug: Ver qué datos recibimos
        if (pallets.length > 0) {
          console.log('[Sabana] Primer pallet recibido:', {
            id: pallets[0].id,
            codigo: pallets[0].codigo,
            createdAt: pallets[0].createdAt,
            vehicle: pallets[0].vehicle ? {
              placa: pallets[0].vehicle.placa,
              cliente: pallets[0].vehicle.cliente
            } : null,
            product: pallets[0].product ? {
              nombre: pallets[0].product.nombre
            } : null,
            pesoTotal: pallets[0].pesoTotal,
            descargado: pallets[0].descargado,
            pesoDescarga: pallets[0].pesoDescarga,
            variacionPeso: pallets[0].variacionPeso
          })
        }
        
        // Filtrar por rango de fechas
        if (!range.from || !range.to) {
          console.warn('[Sabana] Rango de fechas incompleto:', range)
          setSabanasData([])
          setLoading(false)
          return
        }
        
        // Crear fechas de inicio y fin del día en zona horaria local
        const startDate = new Date(range.from + 'T00:00:00')
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(range.to + 'T23:59:59.999')
        endDate.setHours(23, 59, 59, 999)
        
        console.log('[Sabana] Filtrando por rango:', { 
          from: range.from, 
          to: range.to, 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString(),
          startDateLocal: startDate.toLocaleString('es-CO'),
          endDateLocal: endDate.toLocaleString('es-CO')
        })
        
        const filteredPallets = pallets.filter((p: any) => {
          if (!p.createdAt && !p.fecha) {
            console.warn('[Sabana] Pallet sin fecha:', p.codigo)
            return false
          }
          
          const fechaStr = p.createdAt || p.fecha
          let fecha: Date
          
          try {
            fecha = new Date(fechaStr)
            
            // Verificar que la fecha sea válida
            if (isNaN(fecha.getTime())) {
              console.warn('[Sabana] Fecha inválida:', fechaStr, 'para pallet:', p.codigo)
              return false
            }
          } catch (error) {
            console.warn('[Sabana] Error al parsear fecha:', fechaStr, 'para pallet:', p.codigo)
            return false
          }
          
          // Comparar fechas directamente
          const isInRange = fecha >= startDate && fecha <= endDate
          
          if (!isInRange && pallets.length < 20) {
            // Solo loggear si hay pocos pallets para no saturar la consola
            console.log('[Sabana] Pallet fuera de rango:', {
              codigo: p.codigo,
              fecha: fecha.toISOString(),
              fechaLocal: fecha.toLocaleString('es-CO'),
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            })
          }
          
          return isInRange
        })
        
        console.log('[Sabana] Pallets filtrados:', filteredPallets.length, 'de', pallets.length, 'total')
        
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
        
        vehiclesMap.forEach((pallets) => {
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
          
          // Obtener fecha en zona horaria local
          const fechaRaw = firstPallet.createdAt || firstPallet.fecha
          const fecha = new Date(fechaRaw)
          
          // Obtener fecha local usando los componentes de fecha local (no UTC)
          // Esto asegura que la fecha mostrada sea la del día local, no UTC
          const year = fecha.getFullYear()
          const month = fecha.getMonth()
          const day = fecha.getDate()
          
          // Formatear fecha como YYYY-MM-DD usando componentes locales
          const fechaString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          
          const horaIngreso = fecha.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Bogota'
          })
          
          // Obtener cliente, producto y código de trazabilidad (usar el del primer pallet o del vehículo)
          const cliente = vehicle.cliente || 'N/A'
          const producto = firstPallet.product?.nombre || 'N/A'
          const codigoTrazabilidad = vehicle.codigoTrazabilidad || 'N/A'
          
          console.log('[Sabana] Datos del vehículo:', {
            placa: vehicle.placa,
            codigoTrazabilidad: vehicle.codigoTrazabilidad,
            cliente: vehicle.cliente,
            producto: firstPallet.product?.nombre,
            fechaRaw: fechaRaw,
            fechaISO: fecha.toISOString(),
            fechaLocal: fechaString,
            fechaLocalString: fecha.toLocaleDateString('es-CO')
          })
          
          // Mapear pallets a formato de paletes y trituradora
          const paletes = pallets.map((p: any, index: number) => {
            const productoPallet = p.product?.nombre || producto
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
            // Estado: ok si la variación es <= 5% del peso total O <= 10kg O si no está descargado (pendiente)
            const porcentajeVariacion = pesoTotal > 0 ? (pesoTolerado / pesoTotal) * 100 : 0
            const estado: 'ok' | 'error' = !descargado || pesoTolerado <= 10 || porcentajeVariacion <= 5 ? 'ok' : 'error'
            
            return {
              numero: index + 1,
              pesoReal: pesoTotal,
              pesoEstimado: pesoTotal, // Usamos el mismo peso como estimado
              pesoTolerado: pesoTolerado,
              estado,
              producto: productoPallet
            }
          })
          
          const trituradora = pallets.map((p: any, index: number) => {
            const productoPallet = p.product?.nombre || producto
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
            const pesoTriturado = descargado && pesoDescarga !== null ? pesoDescarga : (descargado ? 0 : 0)
            const diferenciaTrit = pesoTotal - pesoTriturado
            
            // Estado: ok si está descargado Y la diferencia es <= 5% del peso total O <= 10kg
            // Si no está descargado, mostrar como pendiente (no error)
            const porcentajeDiferencia = pesoTotal > 0 ? (Math.abs(diferenciaTrit) / pesoTotal) * 100 : 0
            const estado: 'ok' | 'error' = descargado && pesoDescarga !== null && pesoDescarga > 0
              ? (Math.abs(diferenciaTrit) <= 10 || porcentajeDiferencia <= 5 ? 'ok' : 'error')
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
              estado,
              producto: productoPallet
            }
          })
          
          data.push({
            placa: vehicle.placa || 'N/A',
            codigoTrazabilidad: codigoTrazabilidad,
            cliente: cliente,
            producto: producto,
            pesoAntes: pesoIngreso,
            pesoDespues: pesoSalida || 0,
            diferencia: diferencia,
            horaIngreso: horaIngreso,
            fecha: fechaString, // Usar fecha local en lugar de ISO
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

  return { sabanasData, loading }
}

