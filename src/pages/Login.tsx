import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import loginImg from '../assets/images/login.png'
import esloganImg from '../assets/images/eslogan.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('admin@bateriasecuador.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FDB71A' }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
        style={{ border: '3px solid #EE3626' }}
      >
        {/* PANEL IZQUIERDO */}
        <div className="hidden lg:flex items-center justify-center bg-[#FDB71A] p-10">
          <img
            src={loginImg}
            alt="Login"
            className="max-h-[520px] w-full object-contain animate-fade-in"
          />
        </div>

        {/* PANEL DERECHO */}
        <div className="relative flex items-center justify-center p-8 md:p-12">
          {/* Eslogan */}
          <img
            src={esloganImg}
            alt="Eslogan"
            className="absolute top-4 right-4 h-24"
          />

          <div className="w-full max-w-md">
            <h2 className="text-4xl font-extrabold text-center text-black mb-2">
              Bienvenido
            </h2>
            <p className="text-center text-gray-600 mb-10">
              Accede a tu panel administrativo
            </p>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  autoComplete="username"
                  required
                  className="
                    w-full rounded-xl border border-gray-300 bg-gray-50
                    px-4 py-3 text-black placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626]
                    transition-all
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="
                      w-full rounded-xl border border-gray-300 bg-gray-50
                      px-4 py-3 pr-12 text-black placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-[#EE3626] focus:border-[#EE3626]
                      transition-all
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* BOTÓN */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-xl py-3.5 text-white font-semibold
                  shadow-lg transition-all duration-300
                  hover:scale-[1.02] hover:shadow-xl
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100
                "
                style={{ backgroundColor: '#010101' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                      />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
