import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function ProtectedRoute({ roles }: { roles?: Array<'admin' | 'supervisor' | 'operador'> }) {
  const { token, hasRole } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && roles.length > 0 && !hasRole(...roles)) return <Navigate to="/" replace />
  return <Outlet />
}


