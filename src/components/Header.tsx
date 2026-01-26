import { useEffect, useState, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../lib/auth'

type HeaderProps = {
  onMenuClick?: () => void
}

/* Reloj */
const Clock = memo(() => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-sm font-semibold text-black/80 tracking-wide">
      {now.toLocaleString()}
    </span>
  )
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
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDB71A] shadow-xl">
        
        <div className="h-[80px] max-w-[1700px] mx-auto px-6 flex items-center justify-between">
          
          {/* IZQUIERDA */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-3 rounded-xl bg-black/10 hover:bg-black/20 transition"
              >
                <Bars3Icon className="w-6 h-6 text-black" />
              </button>
            )}

            <img
              src="src/images/logo.png"
              alt="Logo"
              className="h-14 object-contain drop-shadow-md"
            />
          </div>

          {/* CENTRO */}
          <Clock />

          {/* DERECHA */}
          <div className="flex items-center gap-4 px-2">
            
            {/* Usuario */}
            <div className="hidden sm:flex flex-col leading-tight text-right">
              <span className="text-[11px] text-black/50 uppercase tracking-wide">
                Usuario
              </span>
              <span className="text-sm font-semibold text-black">
                {user?.name || user?.nombre || user?.email || 'Invitado'}
              </span>
            </div>

            {/* Rol */}
            <span className="hidden md:inline text-xs font-medium text-black bg-black/10 px-3 py-1 rounded-full">
              {user
                ? typeof user.role === 'string'
                  ? user.role
                  : user.role?.codigo || user.role?.nombre || 'Sin rol'
                : '—'}
            </span>

            {/* Separador */}
            <div className="h-7 w-px bg-black/30 hidden sm:block" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EE3626] text-white font-semibold shadow-md hover:brightness-110 hover:scale-105 transition"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {user ? 'Cerrar sesión' : 'Login'}
              </span>
            </button>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="h-[3px] bg-[#EE3626]" />
      </header>

      {/* ESPACIO ENTRE HEADER Y CONTENIDO */}
      <div className="h-[90px]" />
    </>
  )
}