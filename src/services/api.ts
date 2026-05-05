/**
 * Cliente HTTP (Axios) para el frontend web.
 *
 * Mejoras:
 *  - Parseo seguro de respuestas: detecta HTML de proxy/WAF antes de intentar JSON
 *  - Mensajes de error UX claros y diferenciados por tipo
 *  - Interceptor de respuesta robusto con clasificación de errores
 */

import axios, { AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Configuración base
// ---------------------------------------------------------------------------

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL === undefined
    ? 'VITE_API_BASE_URL_PLACEHOLDER'
    : import.meta.env.VITE_API_BASE_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Login / primer arranque del API pueden tardar (DB, bcrypt)
  timeout: 120_000,
})

// ---------------------------------------------------------------------------
// Tipos de error
// ---------------------------------------------------------------------------

export type ApiErrorKind =
  | 'network'     // Sin conexión, timeout, DNS
  | 'auth'        // 401 — credenciales o sesión inválida
  | 'forbidden'   // 403
  | 'not_found'   // 404
  | 'validation'  // 400 — datos inválidos
  | 'server'      // 5xx
  | 'parse'       // Respuesta no-JSON (HTML de proxy/WAF)
  | 'unknown'

export class ApiError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly kind: ApiErrorKind,
    public readonly diagnostic?: string,
  ) {
    super(userMessage)
    this.name = 'ApiError'
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('<') || t.toLowerCase().includes('<html')
}

function extractBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const msg = d.message ?? d.error ?? null
  if (Array.isArray(msg)) return (msg as string[]).filter(Boolean).join(', ') || null
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  return null
}

/**
 * Mapea mensajes técnicos del backend a mensajes UX en español.
 */
function toUserMessage(raw: string, status: number): string {
  const lower = raw.toLowerCase()

  if (lower.includes('must be an email') || lower.includes('email must')) {
    return 'El correo electrónico no tiene un formato válido.'
  }
  if (lower.includes('should not be empty') || lower.includes('must not be empty')) {
    return 'Hay campos obligatorios sin completar.'
  }
  if (lower.includes('must be longer than or equal to')) {
    const n = raw.match(/\d+/)?.[0] ?? ''
    return `La contraseña debe tener al menos ${n} caracteres.`
  }
  if (lower.includes('credenciales inválidas') || lower.includes('invalid credentials') || lower.includes('unauthorized')) {
    return '¡Vaya! Las credenciales ingresadas no son correctas. Asegúrate de que tu correo y contraseña sean correctos.'
  }
  if (lower.includes('token') && (lower.includes('expirado') || lower.includes('expired') || lower.includes('inválido'))) {
    return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
  }
  if (lower.includes('forbidden') || lower.includes('acceso denegado')) {
    return 'No tienes permisos para realizar esta acción.'
  }
  if (lower.includes('not found') || lower.includes('no encontrado')) {
    return 'El recurso solicitado no existe.'
  }
  if (status >= 500) {
    return 'Ocurrió un error en el servidor. Intenta nuevamente en unos momentos. Si el problema persiste, contacta a soporte.'
  }
  // Si ya está en español y es legible, devolverlo tal cual
  if (/^[a-záéíóúüñ\s.,!¡¿?:;()\-]+$/i.test(raw) && raw.length < 120) {
    return raw
  }
  return `Error del servidor (${status}). Intenta nuevamente.`
}

// ---------------------------------------------------------------------------
// Interceptor de request: adjuntar token
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Interceptor de response: parseo seguro + mensajes UX
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // --- Sin respuesta del servidor (red, timeout, DNS, HTML de proxy) ---
    if (!error.response) {
      const msg = error.message ?? ''
      const isTimeout = error.code === 'ECONNABORTED' || msg.includes('timeout')
      const isNetwork =
        msg.includes('Network Error') ||
        msg.includes('ERR_NETWORK') ||
        error.code === 'ERR_NETWORK'

      if (isTimeout) {
        return Promise.reject(
          new ApiError(
            '¡Ups! La solicitud tardó demasiado. Verifica tu conexión a internet e intenta nuevamente.',
            'network',
            `timeout url=${error.config?.url}`,
          ),
        )
      }

      if (isNetwork) {
        return Promise.reject(
          new ApiError(
            'Parece que hubo un problema al conectarnos con el servidor. Verifica tu conexión a internet y vuelve a intentarlo.',
            'network',
            `network_error url=${error.config?.url} msg="${msg}"`,
          ),
        )
      }

      return Promise.reject(
        new ApiError(
          '¡Ups! No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.',
          'network',
          `no_response url=${error.config?.url} msg="${msg}"`,
        ),
      )
    }

    const status = error.response.status
    const responseData = error.response.data

    // --- Detectar respuesta HTML de proxy/WAF ---
    if (typeof responseData === 'string' && looksLikeHtml(responseData)) {
      console.error('[API] Respuesta HTML recibida (proxy/WAF):', {
        status,
        url: error.config?.url,
        snippet: responseData.substring(0, 200),
      })
      return Promise.reject(
        new ApiError(
          '¡Ups! No pudimos conectar con el servidor. Puede que haya un pequeño problema con la URL. Intenta de nuevo en unos minutos.',
          'parse',
          `html_response status=${status} url=${error.config?.url}`,
        ),
      )
    }

    // --- Log de diagnóstico ---
    console.error('[API] Error en petición:', {
      url: error.config?.url,
      method: error.config?.method,
      status,
      data: responseData,
    })

    // --- 401: credenciales o sesión ---
    if (status === 401) {
      const backendMsg = extractBackendMessage(responseData) ?? ''
      const isSessionError =
        backendMsg.toLowerCase().includes('token') ||
        backendMsg.toLowerCase().includes('expired') ||
        backendMsg.toLowerCase().includes('invalid') ||
        backendMsg.toLowerCase().includes('autenticación') ||
        backendMsg.toLowerCase().includes('unauthorized')

      if (isSessionError && window.location.pathname !== '/login') {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        console.warn('[API] Sesión expirada, redirigiendo al login')
        window.location.href = '/login'
      }

      return Promise.reject(
        new ApiError(
          '¡Vaya! Las credenciales ingresadas no son correctas. Asegúrate de que tu correo y contraseña sean correctos.',
          'auth',
          `status=401 url=${error.config?.url} backend="${backendMsg}"`,
        ),
      )
    }

    // --- Otros errores HTTP ---
    const backendMsg = extractBackendMessage(responseData)
    const userMsg = toUserMessage(backendMsg ?? `Error ${status}`, status)

    let kind: ApiErrorKind = 'unknown'
    if (status === 403) kind = 'forbidden'
    else if (status === 404) kind = 'not_found'
    else if (status >= 400 && status < 500) kind = 'validation'
    else if (status >= 500) kind = 'server'

    return Promise.reject(
      new ApiError(
        userMsg,
        kind,
        `status=${status} url=${error.config?.url} backend="${backendMsg ?? ''}"`,
      ),
    )
  },
)

// ---------------------------------------------------------------------------
// Helpers de token
// ---------------------------------------------------------------------------

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}
