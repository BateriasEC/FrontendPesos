import axios from 'axios'

// URL del backend: usar variable de entorno (obligatorio)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
})

// Interceptor para agregar el token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage en cada petición
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log del error para debugging
    console.error('❌ [API] Error en petición:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    })

    // Si es error de red (sin respuesta del servidor)
    if (!error.response) {
      console.error('❌ [API] Error de conexión - No se recibió respuesta del servidor')
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        error.message = 'Error de conexión. Verifique que el servidor esté disponible y su conexión a internet.'
      }
    }

    if (error.response?.status === 401) {
      // Verificar si el error es realmente de autenticación
      const errorMessage = error.response?.data?.message || ''
      
      // Solo cerrar sesión si es un error de autenticación real (no errores de validación u otros)
      if (errorMessage.includes('token') || 
          errorMessage.includes('autenticación') || 
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('invalid')) {
        // Token inválido o expirado - limpiar y redirigir al login
        localStorage.removeItem('token')
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          console.warn('Sesión cerrada: Token inválido o expirado')
          window.location.href = '/login'
        }
      } else {
        // Es un 401 pero no es de autenticación (puede ser validación u otro error)
        // No cerrar sesión, solo rechazar la promesa
        console.warn('Error 401 no relacionado con autenticación:', errorMessage)
      }
    }
    return Promise.reject(error)
  }
)

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}


