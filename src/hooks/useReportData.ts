import { useCallback, useState } from 'react'
import { api } from '../services/api'

type Row = { id: number; fecha: string; variacion: number; productoId: number; cliente: string }

/** YYYY-MM-DD en zona América/Bogotá (evita desfaces UTC al filtrar). */
function toDateKeyBogota(iso: string | null | undefined): string | null {
  if (iso == null) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

export function useReportData() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (from?: string, to?: string) => {
    setLoading(true)
    try {
      const response = await api.get('/pallets')
      const responseData = response.data?.data || response.data
      let pallets: any[] = []
      
      if (responseData && Array.isArray(responseData.data)) {
        pallets = responseData.data
      } else if (Array.isArray(responseData)) {
        pallets = responseData
      }
      
      if (pallets.length > 0) {
        const mappedWeighings = pallets.map((p: any) => {
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

        if (from && to) {
          setRows(
            mappedWeighings.filter((r) => {
              const k = toDateKeyBogota(r.fecha)
              if (!k) return false
              return k >= from && k <= to
            }),
          )
        } else {
          setRows(mappedWeighings)
        }
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

