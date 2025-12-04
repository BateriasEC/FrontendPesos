import { useMemo } from 'react'

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
  const sabanasData = useMemo(() => {
    const data: SabanaData[] = []
    const startDate = new Date(range.from)
    const endDate = new Date(range.to)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    for (let i = 0; i < diffDays; i++) {
      const fecha = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const numCamiones = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < numCamiones; j++) {
        const hora = String(Math.floor(Math.random() * 8) + 8).padStart(2, '0') + ':' + 
                     String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const pesoAntes = Math.floor(Math.random() * 5000) + 10000
        const pesoDespues = Math.floor(pesoAntes * 0.65) + Math.floor(Math.random() * 1000)
        const diferencia = pesoAntes - pesoDespues
        const numPaletes = Math.floor(Math.random() * 3) + 2
        
        const paletes = []
        const trituradora = []
        
        for (let p = 1; p <= numPaletes; p++) {
          const pesoReal = Math.floor(Math.random() * 50) + 450
          const pesoEstimado = pesoReal + Math.floor(Math.random() * 10) - 5
          const pesoTolerado = Math.abs(pesoReal - pesoEstimado)
          const estadoPaletes = pesoTolerado <= 3 ? 'ok' : 'error'
          
          const pesoPalet = pesoReal
          const pesoTriturado = pesoPalet - (Math.random() * 3)
          const diferenciaTrit = pesoPalet - pesoTriturado
          const estadoTrit = diferenciaTrit <= 2 ? 'ok' : 'error'
          
          paletes.push({
            numero: p,
            pesoReal,
            pesoEstimado,
            pesoTolerado,
            estado: estadoPaletes
          })
          
          trituradora.push({
            numero: p,
            pesoPalet,
            pesoTriturado: Math.round(pesoTriturado * 10) / 10,
            diferencia: Math.round(diferenciaTrit * 10) / 10,
            estado: estadoTrit
          })
        }
        
        data.push({
          placa: `PCO-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          pesoAntes,
          pesoDespues,
          diferencia,
          horaIngreso: hora,
          fecha: fecha.toISOString().slice(0, 10),
          paletes,
          trituradora
        })
      }
    }
    
    return data
  }, [range.from, range.to])

  return sabanasData
}

