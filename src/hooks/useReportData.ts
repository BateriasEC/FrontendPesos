import { useCallback, useState } from 'react'
import { api } from '../services/api'

type Row = { id: number; fecha: string; variacion: number; productoId: number; cliente: string }

export function useReportData() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Obtener todos los pesajes del backend
      const response = await api.get('/pallets')
      const responseData = response.data?.data || response.data
      let pallets: any[] = []
      
      // Si es un objeto paginado, extraer el array de data
      if (responseData && Array.isArray(responseData.data)) {
        pallets = responseData.data
      } else if (Array.isArray(responseData)) {
        pallets = responseData
      }
      
      if (pallets.length > 0) {
        // Mapear los pallets a la estructura esperada
        const mappedWeighings = pallets.map((p: any) => {
          // Calcular variación: si hay pesoSalida del vehículo, usar esa variación
          // Si no, usar la variación del pallet (pesoTotal - pesoDescarga)
          const pesoIngreso = p.vehicle?.pesoIngreso 
            ? (typeof p.vehicle.pesoIngreso === 'string' ? parseFloat(p.vehicle.pesoIngreso) : Number(p.vehicle.pesoIngreso))
            : (Number(p.pesoTotal) || 0);
          
          const pesoSalida = p.vehicle?.pesoSalida
            ? (typeof p.vehicle.pesoSalida === 'string' ? parseFloat(p.vehicle.pesoSalida) : Number(p.vehicle.pesoSalida))
            : null;
          
          const variacion = pesoSalida !== null && pesoIngreso > 0
            ? pesoIngreso - pesoSalida
            : (p.descargado && p.variacionPeso ? Number(p.variacionPeso) : 0);
          
          return {
            id: p.id,
            fecha: p.createdAt || new Date().toISOString(),
            variacion: variacion,
            productoId: p.productId || p.product?.id || '',
            cliente: p.vehicle?.cliente || ''
          }
        })
        setRows(mappedWeighings)
      } else {
        setRows([])
      }
    } catch (error: any) {
      console.error('Error cargando datos de reportes:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { rows, loading, load }
}

