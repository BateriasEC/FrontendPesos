import { useState } from 'react'
import { AuditLogTable } from '../components/auditoria/AuditLogTable'
import { DeviceActivityTable } from '../components/auditoria/DeviceActivityTable'

type TabId = 'registros' | 'dispositivos'

const TABS: { id: TabId; label: string }[] = [
  { id: 'registros', label: 'Registros' },
  { id: 'dispositivos', label: 'Dispositivos' },
]

export default function Auditoria() {
  const [tab, setTab] = useState<TabId>('registros')

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold">Auditoría y trazabilidad</h1>
        <p className="text-sm text-white/60 mt-2 max-w-3xl">
          Historial de operaciones realizadas desde la app Android: quién las hizo, desde qué
          dispositivo, cuándo se sincronizaron y qué cambió en cada actualización.
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
        <div className={tab === 'registros' ? '' : 'hidden'}>
          <AuditLogTable />
        </div>
        <div className={tab === 'dispositivos' ? '' : 'hidden'}>
          <DeviceActivityTable />
        </div>
      </div>
    </div>
  )
}
