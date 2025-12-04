import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
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

// Interceptor para manejar errores 401 (token inválido o expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - limpiar y redirigir al login
      localStorage.removeItem('token')
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
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


