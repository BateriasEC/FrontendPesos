import { useState } from 'react'
import { DeviceCrudPanel } from '../components/config/DeviceCrudPanel'
import { ToleranciasPesajePanel } from '../components/config/ToleranciasPesajePanel'

type TabId = 'impresoras' | 'balanzas' | 'pdas' | 'tolerancias'

const TABS: { id: TabId; label: string }[] = [
  { id: 'impresoras', label: 'Impresoras' },
  { id: 'balanzas', label: 'Balanzas' },
  { id: 'pdas', label: 'PDAs' },
  { id: 'tolerancias', label: 'Tolerancias de peso' },
]

export default function ConfiguracionDispositivos() {
  const [tab, setTab] = useState<TabId>('impresoras')

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold">Configuración de dispositivos</h1>
        <p className="text-sm text-white/60 mt-2 max-w-3xl">
          Administre impresoras, balanzas, PDAs y tolerancias de pesaje desde la web. Los campos
          replican la configuración de hardware de la app móvil (IP, puerto, habilitado y rango ± kg).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-white/15 text-white border border-white/20 border-b-transparent -mb-px'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6">
        <div className={tab === 'impresoras' ? '' : 'hidden'}>
          <DeviceCrudPanel
            tipo="IMPRESORA"
            title="Impresoras de tickets"
            description="Impresoras térmicas Zebra vía TCP (puerto habitual 9100). Puede registrar varias impresoras."
          />
        </div>
        <div className={tab === 'balanzas' ? '' : 'hidden'}>
          <DeviceCrudPanel
            tipo="BALANZA"
            title="Balanzas"
            description="Balanzas de ingreso/salida, pallets y despacho. Asigne el rol equivalente al de la app móvil."
          />
        </div>
        <div className={tab === 'pdas' ? '' : 'hidden'}>
          <DeviceCrudPanel
            tipo="PDA"
            title="PDAs"
            description="Dispositivos móviles autorizados en planta. Registre identificador y descripción."
          />
        </div>
        <div className={tab === 'tolerancias' ? '' : 'hidden'}>
          <ToleranciasPesajePanel />
        </div>
      </div>
    </div>
  )
}
