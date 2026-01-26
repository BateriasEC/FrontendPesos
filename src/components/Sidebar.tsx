import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  HomeIcon,
  UsersIcon,
  Squares2X2Icon,
  ScaleIcon,
  ChartBarIcon,
  TruckIcon,
  UserGroupIcon,
  CubeIcon
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
    <aside className="flex flex-col h-full text-sm space-y-30 ">
      
      {/* CONTENIDO SUPERIOR */}
      <div className="flex-1 space-y-6">
        
        {/* PRINCIPAL */}
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

          <SidebarLink to="/clientes" icon={UserGroupIcon} label="Clientes" onNavigate={onNavigate} />
          <SidebarLink to="/catalogo" icon={Squares2X2Icon} label="Catálogo" onNavigate={onNavigate} />
        </nav>

        <div className="h-px bg-white/10 mx-2" />

        {/* OPERACIONES */}
        <nav className="space-y-1">
          <SidebarLink to="/pesajes" icon={ScaleIcon} label="Pesajes" onNavigate={onNavigate} />
          <SidebarLink to="/vehiculos" icon={TruckIcon} label="Vehículos" onNavigate={onNavigate} />
          <SidebarLink to="/productos" icon={CubeIcon} label="Volumen" onNavigate={onNavigate} />
        </nav>

        <div className="h-px bg-white/10 mx-2" />

        {/* REPORTES */}
        <nav className="space-y-1">
          <SidebarLink to="/reportes" icon={ChartBarIcon} label="Reportes" onNavigate={onNavigate} />
        </nav>
      </div>

      {/* ESPACIADOR INFERIOR (para que llegue hasta abajo visualmente) */}
      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/40 text-center">
        © Baterias Ecuador
      </div>
    </aside>
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
