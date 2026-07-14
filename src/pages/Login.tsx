/**
 * Página de Login (Web)
 *
 * Mejoras UX:
 *  - Mensajes de error diferenciados por tipo (red, auth, servidor, validación)
 *  - Control de intentos fallidos con aviso progresivo
 *  - Feedback visual durante carga con texto contextual
 *  - Enlace de soporte cuando los intentos superan el límite
 */

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { EyeIcon, EyeSlashIcon, WifiIcon, LockClosedIcon, ServerIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import loginImg from '../assets/images/login.png'
import { ApiError } from '../services/api'
import type { ApiErrorKind } from '../services/api'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5
const SUPPORT_MSG = 'Contacta al administrador del sistema.'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ErrorInfo {
  kind: ApiErrorKind
  message: string
}

// ---------------------------------------------------------------------------
// Helper: ícono y color según tipo de error
// ---------------------------------------------------------------------------

function ErrorIcon({ kind }: { kind: ApiErrorKind }) {
  const cls = 'w-5 h-5 flex-shrink-0'
  switch (kind) {
    case 'network':
      return <WifiIcon className={`${cls} text-orange-500`} />
    case 'auth':
      return <LockClosedIcon className={`${cls} text-red-500`} />
    case 'server':
      return <ServerIcon className={`${cls} text-red-500`} />
    default:
      return <ExclamationCircleIcon className={`${cls} text-orange-500`} />
  }
}

function errorBorderColor(kind: ApiErrorKind): string {
  if (kind === 'auth' || kind === 'server') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-orange-200 bg-orange-50 text-orange-700'
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Verificando credenciales...')
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [blockSecondsLeft, setBlockSecondsLeft] = useState(0)
  const blockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isBlocked = failedAttempts >= MAX_ATTEMPTS && blockSecondsLeft > 0

  const startBlockTimer = useCallback(() => {
    if (blockTimerRef.current) clearInterval(blockTimerRef.current)
    setBlockSecondsLeft(10)
    blockTimerRef.current = setInterval(() => {
      setBlockSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(blockTimerRef.current!)
          blockTimerRef.current = null
          setFailedAttempts(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const showError = useCallback((kind: ApiErrorKind, message: string) => {
    setErrorInfo({ kind, message })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorInfo(null)

    // Validación local
    if (!email.trim() || !password) {
      showError('validation', 'Por favor completa todos los campos: correo electrónico y contraseña.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showError('validation', 'El formato del correo electrónico no es válido. Ejemplo: usuario@empresa.com')
      return
    }

    if (isBlocked) {
      showError(
        'auth',
        `Has intentado ${failedAttempts} veces sin éxito. Contacta al administrador del sistema.`,
      )
      return
    }

    setLoading(true)
    setLoadingText('Verificando credenciales...')

    try {
      await login(email.trim(), password)
      setLoadingText('Iniciando sesión...')
      setFailedAttempts(0)
      navigate('/')
    } catch (err: unknown) {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        startBlockTimer()
      }

      if (err instanceof ApiError) {
        showError(err.kind, err.userMessage)
      } else if (err instanceof Error) {
        // Errores lanzados desde auth.tsx antes de la migración
        const msg = err.message.toLowerCase()
        if (msg.includes('conexión') || msg.includes('network') || msg.includes('servidor') || msg.includes('timeout')) {
          showError('network', err.message)
        } else if (msg.includes('credenciales') || msg.includes('inválid') || msg.includes('401')) {
          showError('auth', '¡Vaya! Las credenciales ingresadas no son correctas. Asegúrate de que tu correo y contraseña sean correctos.')
        } else {
          showError('unknown', err.message || 'Ocurrió un error inesperado. Intenta nuevamente.')
        }
      } else {
        showError('unknown', 'Ocurrió un error inesperado. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
      setLoadingText('Verificando credenciales...')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#EB2026' }}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-4xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
        style={{ border: '3px solid #EB2026' }}
      >
        {/* PANEL IZQUIERDO */}
        <div className="hidden lg:flex items-center justify-center bg-[#FDB71A] p-10">
          <img
            src={loginImg}
            alt="Login"
            className="max-h-[520px] w-full object-contain"
          />
        </div>

        {/* PANEL DERECHO */}
        <div className="relative flex items-center justify-center p-8 md:p-16">

          <div className="w-full max-w-lg">
            <h2 className="text-4xl font-extrabold text-center text-black mb-2">
              Bienvenido
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Accede a tu panel administrativo
            </p>

            {/* Aviso de intentos fallidos — solo visible cuando no está cargando */}
            {!loading && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-700">
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>
                  {failedAttempts === 1
                    ? 'Intento fallido. Verifica tus credenciales.'
                    : `${failedAttempts} intentos fallidos. Verifica tus credenciales.`}
                </span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  autoComplete="username"
                  disabled={loading || isBlocked}
                  className="
                    w-full rounded-xl border border-gray-300 bg-gray-50
                    px-4 py-3 text-black placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626]
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  "
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading || isBlocked}
                    className="
                      w-full rounded-xl border border-gray-300 bg-gray-50
                      px-4 py-3 pr-12 text-black placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626]
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isBlocked}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* MENSAJE DE ERROR diferenciado — solo visible cuando no está cargando */}
              {!loading && errorInfo && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${errorBorderColor(errorInfo.kind)}`}>
                  <div className="flex items-start gap-2">
                    <ErrorIcon kind={errorInfo.kind} />
                    <div className="flex-1">
                      <p className="font-semibold mb-0.5">
                        {errorInfo.kind === 'network' && 'Sin conexión al servidor'}
                        {errorInfo.kind === 'auth' && 'Correo o contraseña incorrectos'}
                        {errorInfo.kind === 'server' && 'Error del servidor'}
                        {errorInfo.kind === 'validation' && 'Datos inválidos'}
                        {errorInfo.kind === 'forbidden' && 'Acceso no permitido'}
                        {(errorInfo.kind === 'unknown' || errorInfo.kind === 'parse' || errorInfo.kind === 'not_found') && 'Error inesperado'}
                      </p>
                      <p>{errorInfo.message}</p>
                      {/* Mensaje de soporte — sin mailto, solo texto */}
                      {failedAttempts >= MAX_ATTEMPTS && (
                        <p className="mt-1.5 font-medium">{SUPPORT_MSG}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÓN */}
              <button
                type="submit"
                disabled={loading || isBlocked}
                className="
                  w-full rounded-xl py-3.5 text-white font-semibold
                  shadow-lg transition-all duration-300
                  hover:scale-[1.02] hover:shadow-xl
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                "
                style={{ backgroundColor: '#010101' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    {loadingText}
                  </span>
                ) : isBlocked ? (
                  `Espera ${blockSecondsLeft}s para reintentar`
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Texto de soporte — sin mailto */}
            <p className="mt-6 text-center text-xs text-gray-400">
              ¿Problemas para ingresar? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
