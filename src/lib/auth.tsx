import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { api, setAuthToken } from '../services/api'

type Role = 'admin' | 'supervisor' | 'operador'

type JwtPayload = { id: number; email: string; name: string; role: Role; exp: number }

type User = Omit<JwtPayload, 'exp'>

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function createFakeJwt(user: any): string {
  // Simula JWT; en producción este token debe venir del backend
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8
  const payload = btoa(
    JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, exp })
  )
  const signature = 'mocked-signature'
  return `${header}.${payload}.${signature}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('token')
    if (!t) return null
    try {
      const decoded = jwtDecode<JwtPayload>(t)
      return { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role }
    } catch {
      return null
    }
  })

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.get(`/users`, { params: { email } })
      const found = (data as any[]).find((u) => u.email === email && u.password === password)
      if (!found) throw new Error('Credenciales inválidas')
      const fake = createFakeJwt(found)
      localStorage.setItem('token', fake)
      setToken(fake)
      const decoded = jwtDecode<JwtPayload>(fake)
      setUser({ id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role })
    } catch (error: any) {
      // Si la API falla, usar datos de ejemplo para desarrollo
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('API no disponible, usando datos de ejemplo')
        const mockUsers = [
          { id: 1, email: 'admin@rubix.com', password: 'admin123', name: 'Admin', role: 'admin' },
          { id: 2, email: 'super@rubix.com', password: 'super123', name: 'Supervisor', role: 'supervisor' },
          { id: 3, email: 'oper@rubix.com', password: 'oper123', name: 'Operador', role: 'operador' },
        ]
        const found = mockUsers.find((u) => u.email === email && u.password === password)
        if (!found) throw new Error('Credenciales inválidas')
        const fake = createFakeJwt(found)
        localStorage.setItem('token', fake)
        setToken(fake)
        const decoded = jwtDecode<JwtPayload>(fake)
        setUser({ id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role })
        return
      }
      // Si es otro error, relanzarlo
      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new Error('Credenciales inválidas')
      }
      throw new Error(error.message || 'Error al conectar con el servidor. Verifique su conexión.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const hasRole = (...roles: Role[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const value = useMemo(() => ({ user, token, login, logout, hasRole }), [user, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}


