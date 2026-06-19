import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  HomeIcon,
  UsersIcon,
  Squares2X2Icon,
  ScaleIcon,
  ChartBarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  InboxArrowDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const baseLink =
  'group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200'

const inactive =
  'text-white/80 hover:bg-white/10 hover:text-white'

const active =
  'bg-white/15 text-white shadow-inner'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasRole } = useAuth()

  return (
    <div className="flex flex-col h-full text-sm">
      
      {/* ================= CONTENIDO ================= */}
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">

        {/* ===== PRINCIPAL ===== */}
        <nav className="space-y-1">
          <SidebarLink to="/" icon={HomeIcon} label="Dashboard" onNavigate={onNavigate} />

          {hasRole('admin') && (
            <SidebarLink
              to="/usuarios"
              icon={UsersIcon}
              label="Usuarios"
              onNavigate={onNavigate}
            />
          )}

          {/*<SidebarLink
            to="/clientes"
            icon={UserGroupIcon}
            label="Clientes"
            onNavigate={onNavigate}
          />*/}

          <SidebarLink
            to="/catalogo"
            icon={Squares2X2Icon}
            label="Catálogo"
            onNavigate={onNavigate}
          />

          <SidebarLink
            to="/tipos-operacion"
            icon={ArrowsRightLeftIcon}
            label="Tipos de Operación"
            onNavigate={onNavigate}
          />

          <SidebarLink
            to="/canales-vehiculo"
            icon={ArrowsRightLeftIcon}
            label="Canales del Vehículo"
            onNavigate={onNavigate}
          />
        </nav>

        <div className="h-px bg-white/10 mx-2" />

        {/* ===== OPERACIONES ===== */}
        <nav className="space-y-1">
          <SidebarLink
            to="/pesajes"
            icon={ScaleIcon}
            label="Pesajes"
            onNavigate={onNavigate}
          />

          <SidebarLink
            to="/recepcion"
            icon={InboxArrowDownIcon}
            label="Recepción Pallets"
            onNavigate={onNavigate}
          />

          <SidebarLink
            to="/vehiculos"
            icon={TruckIcon}
            label="Vehículos"
            onNavigate={onNavigate}
          />
        </nav>

        <div className="h-px bg-white/10 mx-2" />

        {/* ===== CONFIGURACIÓN ===== */}
        {(hasRole('admin') || hasRole('supervisor')) && (
          <nav className="space-y-1">
            <SidebarLink
              to="/configuracion-dispositivos"
              icon={Cog6ToothIcon}
              label="Config. dispositivos"
              onNavigate={onNavigate}
            />
          </nav>
        )}

        <div className="h-px bg-white/10 mx-2" />

        {/* ===== REPORTES ===== */}
        <nav className="space-y-1">
          <SidebarLink
            to="/reportes"
            icon={ChartBarIcon}
            label="Reportes"
            onNavigate={onNavigate}
          />
          <SidebarLink
            to="/reportes-alertas"
            icon={ExclamationTriangleIcon}
            label="Alertas"
            onNavigate={onNavigate}
          />
        </nav>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="mt-auto pt-4 border-t border-white/10 text-xs text-white/40 text-center flex-shrink-0">
        © Baterías Ecuador
      </div>
    </div>
  )
}

/* 🔗 Link reutilizable */
function SidebarLink({
  to,
  icon: Icon,
  label,
  onNavigate
}: {
  to: string
  icon: React.ElementType
  label: string
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${baseLink} ${isActive ? active : inactive}`
      }
    >
      <Icon className="w-5 h-5 shrink-0 opacity-80 group-hover:opacity-100" />
      <span className="font-medium tracking-wide">{label}</span>
    </NavLink>
  )
}
