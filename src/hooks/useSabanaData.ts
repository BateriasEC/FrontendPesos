import { useEffect, useState } from 'react'
import { api } from '../services/api'

/** Día de calendario YYYY-MM-DD en América/Bogotá (ISO `createdAt` en UTC). */
function toDateKeyBogota(iso: string | null | undefined): string | null {
  if (iso == null) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

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
    fechaPesaje: string
    horaPesaje: string
    fechaDespacho?: string
    horaDespacho?: string
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
  fechaPesaje: string
  horaPesaje: string
  operador?: string
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
        
        // Filtrar por rango de días (calendario en Bogotá; evita perder filas por UTC)
        if (!range.from || !range.to) {
          console.warn('[Sabana] Rango de fechas incompleto:', range)
          setSabanaPesajesData([])
          setSabanaDespachoData([])
          setLoading(false)
          return
        }

        const filteredPallets = pallets.filter((p: any) => {
          if (!p.createdAt && !p.fecha) {
            return false
          }
          const k = toDateKeyBogota(p.createdAt || p.fecha)
          if (!k) return false
          return k >= range.from && k <= range.to
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
          
          const fechaRaw = firstPallet.createdAt || firstPallet.fecha
          const fecha = new Date(fechaRaw)
          const fechaString = toDateKeyBogota(fechaRaw) || 'N/A'
          
          const horaIngreso = fecha.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Bogota'
          })
          
          const cliente = vehicle.cliente || 'N/A'
          const producto = firstPallet.product?.nombre || 'N/A'
          const codigoTrazabilidad = vehicle.codigoTrazabilidad || 'N/A'
          // Usar el operador del vehículo (viene del backend con fallback ya aplicado)
          const operador = vehicle.user?.fullName || undefined
          
          // Mapear pallets para Sábana de Pesajes
          const palletsData = pallets.map((p: any, index: number) => {
            const productoPallet = p.product?.nombre || producto
            const pesoTotal = Number(p.pesoTotal) || 0
            const descargado = p.descargado === true || p.descargado === 'true' || p.descargado === 1
            
            // Obtener fecha y hora de pesaje del pallet (createdAt)
            const fechaPesajeRaw = p.createdAt || p.fecha
            const fechaPesajeObj = new Date(fechaPesajeRaw)
            const fechaPesajeString = toDateKeyBogota(fechaPesajeRaw) || 'N/A'
            const horaPesaje = fechaPesajeObj.toLocaleTimeString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              timeZone: 'America/Bogota'
            })
            
            let pesoDescarga: number = 0
            let fechaDespachoString = ''
            let horaDespacho = ''
            
            if (descargado && p.pesoDescarga) {
              if (typeof p.pesoDescarga === 'string') {
                pesoDescarga = parseFloat(p.pesoDescarga)
              } else {
                pesoDescarga = Number(p.pesoDescarga)
              }
              if (isNaN(pesoDescarga)) pesoDescarga = 0
              
              // Obtener fecha y hora de despacho (updatedAt cuando se descarga)
              const fechaDespachoRaw = p.updatedAt || p.fechaDescarga || fechaPesajeRaw
              const fechaDespachoObj = new Date(fechaDespachoRaw)
              fechaDespachoString = toDateKeyBogota(fechaDespachoRaw) || ''
              horaDespacho = fechaDespachoObj.toLocaleTimeString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'America/Bogota'
              })
            }
            
            const variacion = pesoTotal - pesoDescarga
            const pesoTolerado = Math.abs(variacion)
            const estadoDespacho: 'despachado' | 'pendiente' = descargado ? 'despachado' : 'pendiente'
            
            // Obtener código independiente
            const codigoIndependiente = p.codigoIndependiente || p.codigo || `PALL-${index + 1}`
            
            // Agregar a datos de despacho
            if (descargado && pesoDescarga > 0) {
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
                horaEntrada: horaIngreso,
                fechaPesaje: fechaPesajeString,
                horaPesaje: horaPesaje,
                operador: operador
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
                horaEntrada: horaIngreso,
                fechaPesaje: fechaPesajeString,
                horaPesaje: horaPesaje,
                operador: operador
              })
            }
            
            return {
              codigoIndependiente,
              numero: index + 1,
              pesoReal: pesoTotal,
              pesoEstimado: pesoTotal,
              pesoTolerado: pesoTolerado,
              estadoDespacho,
              producto: productoPallet,
              fechaPesaje: fechaPesajeString,
              horaPesaje: horaPesaje,
              fechaDespacho: fechaDespachoString || undefined,
              horaDespacho: horaDespacho || undefined
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

