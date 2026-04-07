import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { api, setAuthToken } from '../services/api'

type Role = 'admin' | 'supervisor' | 'operador'

type JwtPayload = { 
  sub?: string | number;  // ID del usuario (puede ser UUID o número)
  id?: number | string;
  email?: string;
  name?: string;
  username?: string;
  fullName?: string;
  role?: Role | string | { codigo: string; nombre: string };
  exp: number;
  iat?: number;
}

type User = Omit<JwtPayload, 'exp'>

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Cargar token del localStorage al iniciar
  const initialToken = localStorage.getItem('token')
  const [token, setToken] = useState<string | null>(initialToken)
  const [user, setUser] = useState<User | null>(() => {
    if (!initialToken) return null
    try {
      const decoded = jwtDecode<JwtPayload>(initialToken)
      
      // Mapear el rol del backend al formato esperado
      const roleMap: Record<string, Role> = {
        'ADMIN': 'admin',
        'SUPERVISOR': 'supervisor',
        'OPERADOR': 'operador',
      }
      
      const roleCode = typeof decoded.role === 'object' && decoded.role?.codigo 
        ? decoded.role.codigo 
        : typeof decoded.role === 'string' 
        ? decoded.role 
        : 'OPERADOR'
      const userRole = roleMap[roleCode.toUpperCase()] || 'operador'
      
      // Obtener ID (puede venir como sub, id, o ser un UUID)
      const userId = decoded.sub || decoded.id || 1
      const userIdNumber = typeof userId === 'string' ? parseInt(userId.replace(/-/g, '').substring(0, 10), 16) % 2147483647 : userId
      
      return { 
        id: userIdNumber, 
        email: decoded.email || '', 
        name: decoded.fullName || decoded.name || decoded.username || '', 
        role: userRole 
      }
    } catch {
      return null
    }
  })

  // Configurar el token en axios al cargar el componente y cuando cambie
  useEffect(() => {
    if (token) {
      setAuthToken(token)
    } else {
      setAuthToken(null)
    }
  }, [token])

  // Renovar token automáticamente antes de que expire
  useEffect(() => {
    const renewToken = async () => {
      const storedToken = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!storedToken || !refreshToken) return
      
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken)
        const expirationTime = decoded.exp ? decoded.exp * 1000 : 0
        const timeUntilExpiration = expirationTime - Date.now()
        
        // Renovar si expira en menos de 5 minutos (300 segundos)
        if (timeUntilExpiration > 0 && timeUntilExpiration < 5 * 60 * 1000) {
          try {
            // Intentar renovar con refresh_token (si existe endpoint)
            // Por ahora, simplemente extender la sesión manteniendo el token actual
            // TODO: Implementar endpoint /auth/refresh en backend
            console.log('Token próximo a expirar, renovando...')
            // Por ahora, solo loguear - el token seguirá funcionando hasta que expire
          } catch (error) {
            console.warn('Error al renovar token:', error)
          }
        }
        
        if (timeUntilExpiration < 0) {
          // Token ya expirado - cerrar sesión
          console.warn('Token expirado, cerrando sesión')
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
          setToken(null)
          setUser(null)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
      } catch (error) {
        console.error('Error verificando token:', error)
      }
    }

    // Verificar cada 2 minutos (más frecuente para detectar expiración)
    const interval = setInterval(renewToken, 2 * 60 * 1000)
    renewToken() // Verificar inmediatamente

    return () => clearInterval(interval)
  }, [token])

  // Cargar token al iniciar la app (solo una vez)
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken && !token) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken)
        // Verificar si el token no ha expirado
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          // Token expirado
          console.warn('Token expirado al cargar la app')
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        } else {
          // Token válido - mapear usuario
          const roleMap: Record<string, Role> = {
            'ADMIN': 'admin',
            'SUPERVISOR': 'supervisor',
            'OPERADOR': 'operador',
          }
          
          const roleCode = typeof decoded.role === 'object' && decoded.role?.codigo 
            ? decoded.role.codigo 
            : typeof decoded.role === 'string' 
            ? decoded.role 
            : 'OPERADOR'
          const userRole = roleMap[roleCode.toUpperCase()] || 'operador'
          
          const userId = decoded.sub || decoded.id || 1
          const userIdNumber = typeof userId === 'string' ? parseInt(userId.replace(/-/g, '').substring(0, 10), 16) % 2147483647 : userId
          
          setToken(storedToken)
          setUser({ 
            id: userIdNumber, 
            email: decoded.email || '', 
            name: decoded.fullName || decoded.name || decoded.username || '', 
            role: userRole 
          })
        }
      } catch {
        // Token inválido, limpiar
        console.error('Token inválido al cargar la app')
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Llamar al endpoint real del backend
      const response = await api.post(
        '/auth/login',
        { email, password },
        { timeout: 120000 },
      )
      
      // El backend puede devolver: { data: { access_token, user, ... } } o directamente { access_token, user, ... }
      const responseData = response.data.data || response.data
      const { access_token, user } = responseData
      
      if (!access_token || !user) {
        console.error('Respuesta del servidor:', response.data)
        throw new Error('Respuesta inválida del servidor')
      }
      
      // Guardar tokens del backend
      localStorage.setItem('token', access_token)
      if (responseData.refresh_token) {
        localStorage.setItem('refresh_token', responseData.refresh_token)
      }
      setToken(access_token)
      
      // Mapear el usuario del backend al formato esperado
      const roleMap: Record<string, Role> = {
        'ADMIN': 'admin',
        'SUPERVISOR': 'supervisor',
        'OPERADOR': 'operador',
      }
      
      // El rol puede venir como objeto { codigo: 'ADMIN' } o como string
      const roleCode = user.role?.codigo || user.role || 'OPERADOR'
      const userRole = roleMap[roleCode] || 'operador'
      
      // Convertir UUID a número simple para compatibilidad (o usar el UUID directamente)
      const userId = user.id ? (typeof user.id === 'string' ? 1 : user.id) : 1
      
      setUser({
        id: userId,
        email: user.email,
        name: user.fullName || user.username,
        role: userRole,
      })
    } catch (error: any) {
      console.error('Error en login:', error)
      console.error('Detalles del error:', error.response?.data)
      
      // Si es error de credenciales
      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas')
      }
      
      // Si es error de conexión
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response) {
        //throw new Error('Error al conectar con el servidor. Verifique su conexión a internet y que el backend esté disponible.')
        throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.')

      }
      
      // Si es error de CORS
      if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
        throw new Error('Error de conexión. Verifique la configuración del servidor.')
      }
      
      // Otros errores
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error al iniciar sesión'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
  }

  const hasRole = (...roles: Role[]) => {
    if (!user || !user.role) return false
    // Asegurar que user.role sea un Role válido
    const userRole: Role = typeof user.role === 'string' && ['admin', 'supervisor', 'operador'].includes(user.role)
      ? user.role as Role
      : 'operador'
    return roles.includes(userRole)
  }

  const value = useMemo(() => ({ user, token, login, logout, hasRole }), [user, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}


