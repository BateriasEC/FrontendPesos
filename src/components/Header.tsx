import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../lib/auth'

export function Header() {
  const { user, logout } = useAuth()
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <header className="flex items-center justify-between px-4 h-14 bg-brand-dark border-b border-white/10">
      <div className="flex items-center gap-3">
        <img src="/logorubix-removebg-preview.png" alt="Rubix" className="w-8 h-8 object-contain" />
        <div className="font-semibold">Rubix Energy Group</div>
      </div>
      <div className="text-sm text-gray-300 hidden sm:block">{now.toLocaleString()}</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">
          {user ? `${user.name} · ${user.role}` : 'Sesión no iniciada'}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/70 text-sm font-semibold text-white shadow hover:brightness-110 transition"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{user ? 'Cerrar sesión' : 'Ir a login'}</span>
          <span className="sm:hidden">{user ? 'Salir' : 'Login'}</span>
        </button>
      </div>
    </header>
  )
}


