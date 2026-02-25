import { useEffect, useState } from 'react'
import { api } from '../services/api'

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
  pallets: Array<{
    codigoIndependiente: string
    numero: number
    pesoReal: number
    pesoEstimado: number
    pesoTolerado: number
    estadoDespacho: 'despachado' | 'pendiente'
    producto: string
  }>
}

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
  fechaEntrada: string
  horaEntrada: string
}

export function useSabanaData(range: { from: string; to: string }) {
  const [sabanaPesajesData, setSabanaPesajesData] = useState<SabanaPesajesData[]>([])
  const [sabanaDespachoData, setSabanaDespachoData] = useState<SabanaDespachoData[]>([])
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
          setSabanaPesajesData([])
          setSabanaDespachoData([])
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
        
        // Convertir a formato SabanaPesajesData y SabanaDespachoData
        const dataPesajes: SabanaPesajesData[] = []
        const dataDespacho: SabanaDespachoData[] = []
        
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
          
          const year = fecha.getFullYear()
          const month = fecha.getMonth()
          const day = fecha.getDate()
          
          const fechaString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          
          const horaIngreso = fecha.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Bogota'
          })
          
          const cliente = vehicle.cliente || 'N/A'
          const producto = firstPallet.product?.nombre || 'N/A'
          const codigoTrazabilidad = vehicle.codigoTrazabilidad || 'N/A'
          const operador = vehicle.operador || undefined
          
          // Mapear pallets para Sábana de Pesajes
          const palletsData = pallets.map((p: any, index: number) => {
            const productoPallet = p.product?.nombre || producto
            const pesoTotal = Number(p.pesoTotal) || 0
            const descargado = p.descargado === true || p.descargado === 'true' || p.descargado === 1
            
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
            const estadoDespacho: 'despachado' | 'pendiente' = descargado ? 'despachado' : 'pendiente'
            
            // Obtener código independiente
            const codigoIndependiente = p.codigoIndependiente || p.codigo || `PALL-${index + 1}`
            
            // Agregar a datos de despacho
            if (descargado && pesoDescarga > 0) {
              const fechaDespacho = p.fechaDescarga ? new Date(p.fechaDescarga) : fecha
              const fechaDespachoString = `${fechaDespacho.getFullYear()}-${String(fechaDespacho.getMonth() + 1).padStart(2, '0')}-${String(fechaDespacho.getDate()).padStart(2, '0')}`
              const horaDespacho = fechaDespacho.toLocaleTimeString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'America/Bogota'
              })
              
              dataDespacho.push({
                codigoIndependiente,
                placa: vehicle.placa || 'N/A',
                cliente,
                producto: productoPallet,
                pesoDespacho: pesoDescarga,
                fechaDespacho: fechaDespachoString,
                horaDespacho,
                variacion: Math.abs(variacion),
                estadoDespacho: 'completado',
                pesoOriginal: pesoTotal,
                fechaEntrada: fechaString,
                horaEntrada: horaIngreso
              })
            } else {
              // Agregar como pendiente
              dataDespacho.push({
                codigoIndependiente,
                placa: vehicle.placa || 'N/A',
                cliente,
                producto: productoPallet,
                pesoDespacho: 0,
                fechaDespacho: '',
                horaDespacho: '',
                variacion: 0,
                estadoDespacho: 'pendiente',
                pesoOriginal: pesoTotal,
                fechaEntrada: fechaString,
                horaEntrada: horaIngreso
              })
            }
            
            return {
              codigoIndependiente,
              numero: index + 1,
              pesoReal: pesoTotal,
              pesoEstimado: pesoTotal,
              pesoTolerado: pesoTolerado,
              estadoDespacho,
              producto: productoPallet
            }
          })
          
          dataPesajes.push({
            placa: vehicle.placa || 'N/A',
            codigoTrazabilidad: codigoTrazabilidad,
            cliente: cliente,
            producto: producto,
            tipoVehiculo: vehicle.tipoVehiculo,
            pesoIngreso: pesoIngreso,
            pesoSalida: pesoSalida || 0,
            diferencia: diferencia,
            horaIngreso: horaIngreso,
            fecha: fechaString,
            operador: operador,
            pallets: palletsData
          })
        })
        
        setSabanaPesajesData(dataPesajes)
        setSabanaDespachoData(dataDespacho)
      } catch (error: any) {
        console.error('Error cargando datos de sábanas:', error)
        setSabanaPesajesData([])
        setSabanaDespachoData([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [range.from, range.to])

  return { sabanaPesajesData, sabanaDespachoData, loading }
}

