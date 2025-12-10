import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { HomeIcon, UsersIcon, Squares2X2Icon, ScaleIcon, ChartBarIcon, InboxArrowDownIcon, TruckIcon, TagIcon, UserGroupIcon, CubeIcon } from '@heroicons/react/24/outline'

const linkBase = 'flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 transition-colors'
const activeCls = 'cuerpo bg-white/15 text-white'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasRole } = useAuth()
  return (
    <div className="">
    <nav className="space-y-1 text-sm">
        <NavLink to="/" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
          <HomeIcon className=" w-4 h-4" /> Dashboard
        </NavLink>
        {hasRole('admin') && (
          <NavLink to="/usuarios" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
            <UsersIcon className="w-4 h-4" /> Usuarios
          </NavLink>
        )}
        <NavLink to="/clientes" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
          <UserGroupIcon className="w-4 h-4" /> Clientes
        </NavLink>
        <NavLink to="/catalogo" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
          <Squares2X2Icon className="w-4 h-4" /> Catálogo
        </NavLink>
        <NavLink to="/pesajes" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}> 
          <ScaleIcon className="w-4 h-4" /> Pesajes
        </NavLink>
        <NavLink to="/vehiculos" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
          <TruckIcon className="w-4 h-4" /> Vehículos
        </NavLink>
        {/* Oculto por solicitud: Gestiones */}
        {false && (
          <NavLink to="/gestiones" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
            <Squares2X2Icon className="w-4 h-4" /> Gestiones
          </NavLink>
        )}
        {/* Oculto por solicitud: Tolerancias */}
        {false && (
          <NavLink to="/tolerancias" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
            <TagIcon className="w-4 h-4" /> Tolerancias
          </NavLink>
        )}
        <NavLink to="/productos" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
          <CubeIcon className="w-4 h-4" /> Volumen
        </NavLink>
        {/* Oculto por solicitud: Re‑pesos */}
        {false && (
          <NavLink to="/repesos" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`} onClick={onNavigate}>
            <ScaleIcon className="w-4 h-4" /> Re‑pesos
          </NavLink>
        )}
        
        <NavLink 
          to="/reportes" 
          className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`}
          onClick={onNavigate}
        >
          <ChartBarIcon className="w-4 h-4" /> Reportes
        </NavLink>
        {/* <NavLink to="/recepcion" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`}>
          <InboxArrowDownIcon className="w-4 h-4" /> Recepción de Baterías
        </NavLink>
        <NavLink to="/entregas" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`}>
          <TruckIcon className="w-4 h-4" /> Entregas Parciales
        </NavLink>
        <NavLink to="/etiqueta" className={({isActive})=>`${linkBase} ${isActive?activeCls:''}`}>
          <TagIcon className="w-4 h-4" /> Etiqueta
        </NavLink> */}
        
      </nav>
      </div>
      
      
  )
}


