import { useEffect, useState, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../lib/auth'

type HeaderProps = {
  onMenuClick?: () => void
}

// Componente separado para el reloj para evitar re-renders del header completo
const Clock = memo(() => {
  const [now, setNow] = useState(() => new Date())
  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  
  return <div className="text-black text-xs sm:text-sm  hidden md:block shrink-0">{now.toLocaleString()}</div>
})
Clock.displayName = 'Clock'

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header     className="bg-[#FDB71A] text-white flex items-center justify-between px-2 sm:px-4 h-14 border-b  border-white/10 shrink-0 z-30 fixed top-0 left-0 right-0">
      <div className=" flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Botón hamburguesa solo en móvil */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="w-6 h-6 text-white" />
          </button>
        )}
        <img src="src/images/logo.png " alt="" className="w-50 h-50 sm:w-50 sm:h-50 object-contain shrink-0" />
        <div className=" font-semibold text-sm sm:text-base truncate"></div>
      </div>
      <Clock />
      <div className=" flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="text-black text-xs header-text sm:text-sm header-text  hidden sm:inline truncate max-w-[150px] md:max-w-none">
          {user ? user.role : 'Sesión no iniciada'}
        </span>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-[#EE3626] text-xs sm:text-sm font-semibold text-white shadow hover:brightness-110 transition"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className=" hidden sm:inline">{user ? 'Cerrar sesión' : 'Ir a login'}</span>
          <span className="sm:hidden">{user ? 'Salir' : 'Login'}</span>
        </button>
      </div>
    </header>
  )
}


