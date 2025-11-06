import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'

export function Header() {
  const { user, logout } = useAuth()
  const [now, setNow] = useState(new Date())
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
        {user && <span className="text-sm text-gray-300">{user.name} · {user.role}</span>}
        {user && (
          <button onClick={logout} className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm">
            Salir
          </button>
        )}
      </div>
    </header>
  )
}


